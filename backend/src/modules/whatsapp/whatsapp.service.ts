import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappWebhookLog } from './entities/whatsapp-webhook-log.entity';
import { MessageDirection } from '../../common/enums/message-direction.enum';

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
  ) {
    this.apiVersion = config.get<string>('WHATSAPP_API_VERSION', 'v20.0');
    this.phoneNumberId = config.get<string>('WHATSAPP_PHONE_NUMBER_ID', '');
    this.accessToken = config.get<string>('WHATSAPP_ACCESS_TOKEN', '');
    this.apiUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
  }

  /** Send a plain text message via Meta WhatsApp Cloud API */
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

      const data = await response.json() as any;
      const waMessageId = data?.messages?.[0]?.id;

      await this.logMessage(phone, text, MessageDirection.OUT, waMessageId);
    } catch (err) {
      this.logger.error(`Error sending WhatsApp to ${phone}:`, err);
    }
  }

  /** Process incoming webhook payload from Meta */
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

  /** Basic intent handler */
  private async handleIntent(phone: string, text: string): Promise<void> {
    const lowerText = text.toLowerCase().trim();

    if (lowerText.includes('turno') || lowerText.includes('reservar') || lowerText.includes('sacar')) {
      await this.sendTextMessage(
        phone,
        '✂️ ¡Hola! Para reservar tu turno ingresá a nuestra web:\n👉 http://localhost:3000/book\n\nO escribinos "¿Cuándo tienen disponible?" para consultar horarios.',
      );
    } else if (lowerText.includes('cancelar')) {
      await this.sendTextMessage(
        phone,
        'Para cancelar tu turno, por favor contactá directamente con la barbería. 📞',
      );
    } else if (lowerText.includes('horario') || lowerText.includes('disponible')) {
      await this.sendTextMessage(
        phone,
        '⏰ Nuestro horario de atención es:\n*Lunes a Viernes*: 9:00 a 19:00\n*Sábados*: 9:00 a 14:00\n\nReservá tu turno en: http://localhost:3000/book',
      );
    } else {
      await this.sendTextMessage(
        phone,
        '✂️ ¡Hola! Soy el asistente de la barbería. Puedo ayudarte a:\n\n• *Reservar un turno*\n• *Consultar horarios*\n• *Cancelar un turno*\n\n¿En qué te puedo ayudar?',
      );
    }
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
    const log = this.logsRepo.create({ phone, message, direction, waMessageId });
    await this.logsRepo.save(log).catch(() => {});
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }
}
