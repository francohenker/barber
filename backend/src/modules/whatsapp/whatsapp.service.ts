import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappWebhookLog } from './entities/whatsapp-webhook-log.entity';
import { MessageDirection } from '../../common/enums/message-direction.enum';
import { WorkSchedulesService } from '../work-schedules/work-schedules.service';
import { UsersService } from '../users/users.service';
import { DayOfWeek } from '../work-schedules/entities/work-schedule.entity';

const DAY_NAMES: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado',
};

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiVersion: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly apiUrl: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(WhatsappWebhookLog)
    private readonly logsRepo: Repository<WhatsappWebhookLog>,
    private readonly workSchedulesService: WorkSchedulesService,
    private readonly usersService: UsersService,
  ) {
    this.apiVersion = config.get<string>('WHATSAPP_API_VERSION', 'v20.0');
    this.phoneNumberId = config.get<string>('WHATSAPP_PHONE_NUMBER_ID', '');
    this.accessToken = config.get<string>('WHATSAPP_ACCESS_TOKEN', '');
    this.apiUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
  }

  async sendTextMessage(to: string, text: string): Promise<void> {
    const phone = this.normalizePhone(to);
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { preview_url: false, body: text },
        }),
      });

      const data = await response.json();
      const waMessageId = data?.messages?.[0]?.id;

      await this.logMessage(phone, text, MessageDirection.OUT, waMessageId);
    } catch (err) {
      this.logger.error(`Error sending WhatsApp to ${phone}:`, err);
    }
  }

  async processWebhook(body: any): Promise<void> {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const messages = changes?.value?.messages;

    if (!messages?.length) return;

    for (const msg of messages) {
      const from = msg.from;
      const text = msg.text?.body || '';
      const waMessageId = msg.id;

      await this.logMessage(from, text, MessageDirection.IN, waMessageId);
      await this.handleIntent(from, text);
    }
  }

  private async handleIntent(phone: string, text: string): Promise<void> {
    const lowerText = text.toLowerCase().trim();

    if (
      lowerText.includes('turno') ||
      lowerText.includes('reservar') ||
      lowerText.includes('sacar')
    ) {
      await this.sendTextMessage(
        phone,
        '✂️ ¡Hola! Para reservar tu turno ingresá a nuestra web:\n👉 http://localhost:3000/book\n\nO escribinos "¿Cuándo tienen disponible?" para consultar horarios.',
      );
    } else if (lowerText.includes('cancelar')) {
      await this.sendTextMessage(
        phone,
        'Para cancelar tu turno, por favor contactá directamente con la barbería. 📞',
      );
    } else if (
      lowerText.includes('horario') ||
      lowerText.includes('disponible')
    ) {
      const hours = await this.buildHoursMessage();
      await this.sendTextMessage(phone, hours);
    } else {
      await this.sendTextMessage(
        phone,
        '✂️ ¡Hola! Soy el asistente de la barbería. Puedo ayudarte a:\n\n• *Reservar un turno*\n• *Consultar horarios*\n• *Cancelar un turno*\n\n¿En qué te puedo ayudar?',
      );
    }
  }

  private async buildHoursMessage(): Promise<string> {
    const barbers = await this.usersService.findAllBarbers();
    if (barbers.length === 0) {
      return '⏰ No hay horarios configurados aún.\n\nReservá tu turno en: http://localhost:3000/book';
    }

    // Use first barber's schedule (or could aggregate)
    const barber = barbers[0];
    const schedules = await this.workSchedulesService.findByUserId(barber.id);

    if (schedules.length === 0) {
      return '⏰ No hay horarios configurados aún.\n\nReservá tu turno en: http://localhost:3000/book';
    }

    let message = '⏰ *Horarios de atención:*\n\n';

    for (let day = 1; day <= 6; day++) {
      const schedule = schedules.find((s) => s.dayOfWeek === day);
      const dayName = DAY_NAMES[day];

      if (
        !schedule ||
        schedule.isClosed ||
        !schedule.startTime ||
        !schedule.endTime
      ) {
        message += `*${dayName}*: Cerrado\n`;
      } else {
        message += `*${dayName}*: ${schedule.startTime} a ${schedule.endTime}\n`;
      }
    }

    // Sunday
    const sunSchedule = schedules.find((s) => s.dayOfWeek === DayOfWeek.SUNDAY);
    if (
      sunSchedule &&
      !sunSchedule.isClosed &&
      sunSchedule.startTime &&
      sunSchedule.endTime
    ) {
      message += `\n*Domingo*: ${sunSchedule.startTime} a ${sunSchedule.endTime}`;
    } else {
      message += `\n*Domingo*: Cerrado`;
    }

    message += '\n\nReservá tu turno en: http://localhost:3000/book';

    return message;
  }

  async getLogs(): Promise<WhatsappWebhookLog[]> {
    return this.logsRepo.find({ order: { createdAt: 'DESC' }, take: 100 });
  }

  private async logMessage(
    phone: string,
    message: string,
    direction: MessageDirection,
    waMessageId?: string,
  ): Promise<void> {
    const log = this.logsRepo.create({
      phone,
      message,
      direction,
      waMessageId,
    });
    await this.logsRepo.save(log).catch(() => {});
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }
}
