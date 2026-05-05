import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappWebhookLog } from './entities/whatsapp-webhook-log.entity';
import { WhatsappSession, WhatsappBotState } from './entities/whatsapp-session.entity';
import { MessageDirection } from '../../common/enums/message-direction.enum';
import { WorkSchedulesService } from '../work-schedules/work-schedules.service';
import { UsersService } from '../users/users.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { ClientsService } from '../clients/clients.service';
import { ServicesService } from '../services/services.service';
import { WhatsAppWebhookPayload } from '../../common/types/auth.types';
import { DayOfWeek } from '../work-schedules/entities/work-schedule.entity';
import { AppointmentSource } from '../../common/enums/appointment.enum';

const DAY_NAMES: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado',
};

interface WhatsAppApiResponse {
  messages?: Array<{ id: string }>;
}

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
    @InjectRepository(WhatsappSession)
    private readonly sessionsRepo: Repository<WhatsappSession>,
    private readonly workSchedulesService: WorkSchedulesService,
    private readonly usersService: UsersService,
    private readonly appointmentsService: AppointmentsService,
    private readonly clientsService: ClientsService,
    private readonly servicesService: ServicesService,
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

      const data = (await response.json()) as WhatsAppApiResponse;
      const waMessageId = data?.messages?.[0]?.id;

      await this.logMessage(phone, text, MessageDirection.OUT, waMessageId);
    } catch (err) {
      this.logger.error(`Error sending WhatsApp text to ${phone}:`, err);
    }
  }

  async sendMediaMessage(to: string, text: string, imageUrl: string): Promise<void> {
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
          type: 'image',
          image: { 
            link: imageUrl,
            caption: text
          },
        }),
      });

      const data = (await response.json()) as WhatsAppApiResponse;
      const waMessageId = data?.messages?.[0]?.id;

      await this.logMessage(phone, `[IMAGE] ${text}`, MessageDirection.OUT, waMessageId);
    } catch (err) {
      this.logger.error(`Error sending WhatsApp media to ${phone}:`, err);
    }
  }

  async sendInteractiveButtons(to: string, text: string, buttons: {id: string, title: string}[]): Promise<void> {
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
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text },
            action: {
              buttons: buttons.slice(0, 3).map(b => ({
                type: 'reply',
                reply: { id: b.id, title: b.title.substring(0, 20) }
              }))
            }
          }
        }),
      });

      const data = (await response.json()) as WhatsAppApiResponse;
      const waMessageId = data?.messages?.[0]?.id;
      await this.logMessage(phone, `[BUTTONS] ${text}`, MessageDirection.OUT, waMessageId);
    } catch (err) {
      this.logger.error(`Error sending WhatsApp buttons to ${phone}:`, err);
    }
  }

  async sendInteractiveList(to: string, text: string, buttonText: string, rows: {id: string, title: string, description?: string}[]): Promise<void> {
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
          type: 'interactive',
          interactive: {
            type: 'list',
            body: { text },
            action: {
              button: buttonText.substring(0, 20),
              sections: [
                {
                  title: 'Opciones',
                  rows: rows.slice(0, 10).map(r => ({
                    id: r.id,
                    title: r.title.substring(0, 24),
                    description: r.description?.substring(0, 72)
                  }))
                }
              ]
            }
          }
        }),
      });

      const data = (await response.json()) as WhatsAppApiResponse;
      const waMessageId = data?.messages?.[0]?.id;
      await this.logMessage(phone, `[LIST] ${text}`, MessageDirection.OUT, waMessageId);
    } catch (err) {
      this.logger.error(`Error sending WhatsApp list to ${phone}:`, err);
    }
  }

  async processWebhook(body: WhatsAppWebhookPayload): Promise<void> {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const messages = changes?.value?.messages;

    if (!messages?.length) return;

    for (const msg of messages) {
      const from = msg.from;
      let text = '';
      let interactiveId = '';

      if (msg.type === 'text') {
        text = msg.text?.body ?? '';
      } else if (msg.type === 'interactive') {
        if (msg.interactive?.type === 'button_reply') {
          interactiveId = msg.interactive.button_reply?.id ?? '';
          text = msg.interactive.button_reply?.title ?? '';
        } else if (msg.interactive?.type === 'list_reply') {
          interactiveId = msg.interactive.list_reply?.id ?? '';
          text = msg.interactive.list_reply?.title ?? '';
        }
      }

      const waMessageId = msg.id;

      await this.logMessage(from, text || interactiveId, MessageDirection.IN, waMessageId);
      await this.handleFsm(from, text, interactiveId);
    }
  }

  private async getSession(phone: string): Promise<WhatsappSession> {
    let session = await this.sessionsRepo.findOne({ where: { phone } });
    if (!session) {
      session = this.sessionsRepo.create({ phone, state: WhatsappBotState.INIT, bookingData: {} });
      session = await this.sessionsRepo.save(session);
    }
    return session;
  }

  private async resetSession(session: WhatsappSession) {
    session.state = WhatsappBotState.INIT;
    session.bookingData = {};
    await this.sessionsRepo.save(session);
  }

  private async handleFsm(phone: string, text: string, interactiveId: string): Promise<void> {
    const session = await this.getSession(phone);
    const lowerText = text.toLowerCase().trim();

    // Global cancel/reset command
    if (lowerText === 'cancelar' || lowerText === 'salir' || lowerText === 'menu') {
      await this.resetSession(session);
      return this.sendMainMenu(phone);
    }

    try {
      switch (session.state) {
        case WhatsappBotState.INIT:
          await this.handleInitState(session, lowerText, interactiveId);
          break;
        case WhatsappBotState.SELECT_DAY:
          await this.handleSelectDayState(session, interactiveId);
          break;
        case WhatsappBotState.SELECT_TIME:
          await this.handleSelectTimeState(session, interactiveId);
          break;
        case WhatsappBotState.CONFIRM_BOOKING:
          await this.handleConfirmState(session, interactiveId);
          break;
        default:
          await this.resetSession(session);
          await this.sendMainMenu(phone);
      }
    } catch (error) {
      this.logger.error(`Error in FSM for ${phone}:`, error);
      await this.sendTextMessage(phone, 'Ocurrió un error. Escribe "menu" para volver a empezar.');
      await this.resetSession(session);
    }
  }

  private async sendMainMenu(phone: string) {
    await this.sendInteractiveButtons(phone, '¡Hola! Soy el asistente virtual de la barbería. ¿En qué te puedo ayudar?', [
      { id: 'cmd_book', title: 'Reservar Turno' },
      { id: 'cmd_hours', title: 'Ver Horarios' }
    ]);
  }

  private async handleInitState(session: WhatsappSession, text: string, interactiveId: string) {
    if (interactiveId === 'cmd_book' || text.includes('reservar') || text.includes('turno')) {
      // Find a default barber and service to keep the flow simple
      const barbers = await this.usersService.findAllBarbers();
      if (!barbers.length) {
        return this.sendTextMessage(session.phone, 'Lo siento, no hay barberos disponibles actualmente.');
      }
      
      const services = await this.servicesService.findAll();
      if (!services.length) {
        return this.sendTextMessage(session.phone, 'Lo siento, no hay servicios configurados.');
      }

      session.bookingData = { barberId: barbers[0].id, serviceId: services[0].id };
      session.state = WhatsappBotState.SELECT_DAY;
      await this.sessionsRepo.save(session);

      // Generate next 7 days list
      const rows = [];
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const dayName = DAY_NAMES[d.getDay()];
        
        rows.push({
          id: `day_${dateStr}`,
          title: `${dayName} ${dd}/${mm}`,
        });
      }

      await this.sendInteractiveList(session.phone, 'Por favor, selecciona el día para tu turno:', 'Elegir Día', rows);

    } else if (interactiveId === 'cmd_hours' || text.includes('horario') || text.includes('disponible')) {
      const hours = await this.buildHoursMessage();
      await this.sendTextMessage(session.phone, hours);
      await this.sendMainMenu(session.phone); // Return to menu
    } else {
      await this.sendMainMenu(session.phone);
    }
  }

  private async handleSelectDayState(session: WhatsappSession, interactiveId: string) {
    if (!interactiveId.startsWith('day_')) {
      return this.sendTextMessage(session.phone, 'Por favor, usa el botón del menú para seleccionar un día, o escribe "cancelar" para volver al menú principal.');
    }

    const selectedDate = interactiveId.replace('day_', '');
    session.bookingData.selectedDate = selectedDate;
    
    // Check available times
    const service = await this.servicesService.findOne(session.bookingData.serviceId!);
    const slots = await this.appointmentsService.getAvailableSlots(
      selectedDate,
      session.bookingData.barberId!,
      service.duration,
    );

    if (slots.length === 0) {
      await this.sendTextMessage(session.phone, `Lo siento, no hay turnos disponibles para el ${selectedDate}. Por favor, elige otro día usando el menú anterior.`);
      // We keep them in SELECT_DAY so they can reply to the previous list
      return;
    }

    session.state = WhatsappBotState.SELECT_TIME;
    await this.sessionsRepo.save(session);

    const rows = slots.map(time => ({
      id: `time_${time}`,
      title: time,
    }));

    await this.sendInteractiveList(session.phone, `Horarios disponibles para el ${selectedDate}:`, 'Elegir Hora', rows);
  }

  private async handleSelectTimeState(session: WhatsappSession, interactiveId: string) {
    if (!interactiveId.startsWith('time_')) {
      return this.sendTextMessage(session.phone, 'Por favor, selecciona un horario de la lista, o escribe "cancelar" para volver.');
    }

    const selectedTime = interactiveId.replace('time_', '');
    session.bookingData.selectedTime = selectedTime;
    
    session.state = WhatsappBotState.CONFIRM_BOOKING;
    await this.sessionsRepo.save(session);

    const service = await this.servicesService.findOne(session.bookingData.serviceId!);

    await this.sendInteractiveButtons(
      session.phone, 
      `*Resumen del Turno*\n\n📅 Fecha: ${session.bookingData.selectedDate}\n⏰ Hora: ${selectedTime}\n✂️ Servicio: ${service.name}\n\n¿Deseas confirmar este turno?`,
      [
        { id: 'confirm_yes', title: '✅ Confirmar' },
        { id: 'confirm_no', title: '❌ Cancelar' }
      ]
    );
  }

  private async handleConfirmState(session: WhatsappSession, interactiveId: string) {
    if (interactiveId === 'confirm_no') {
      await this.sendTextMessage(session.phone, 'Reserva cancelada. ¡Esperamos verte pronto!');
      await this.resetSession(session);
      return;
    }

    if (interactiveId !== 'confirm_yes') {
      return this.sendTextMessage(session.phone, 'Por favor, usa los botones para confirmar o cancelar.');
    }

    // Process booking
    try {
      // Find or create client
      const client = await this.clientsService.findOrCreate({
        phone: session.phone,
        name: 'Cliente WhatsApp' // Default name, can be updated later by admin
      });

      await this.appointmentsService.create({
        date: session.bookingData.selectedDate!,
        startTime: session.bookingData.selectedTime!,
        clientId: client.id,
        barberId: session.bookingData.barberId!,
        serviceId: session.bookingData.serviceId!,
        notes: 'Turno agendado vía WhatsApp',
      }, AppointmentSource.WHATSAPP); // Need to make sure WHATSAPP source exists or just use WEB if it doesn't

      await this.sendTextMessage(session.phone, `¡Tu turno ha sido confirmado con éxito! 🎉\n\nTe esperamos el ${session.bookingData.selectedDate} a las ${session.bookingData.selectedTime}.`);
    } catch (error: any) {
      this.logger.error('Failed to book via whatsapp', error);
      await this.sendTextMessage(session.phone, 'Lo siento, hubo un problema al confirmar tu turno. Es posible que el horario ya no esté disponible. Por favor, intenta de nuevo escribiendo "menu".');
    }

    await this.resetSession(session);
  }

  private async buildHoursMessage(): Promise<string> {
    const barbers = await this.usersService.findAllBarbers();
    if (barbers.length === 0) {
      return 'No hay horarios configurados aun.';
    }

    const barber = barbers[0];
    const schedules = await this.workSchedulesService.findByUserId(barber.id);

    if (schedules.length === 0) {
      return 'No hay horarios configurados aun.';
    }

    let message = '*Horarios de atencion:*\n\n';

    for (let day = 1; day <= 6; day++) {
      const schedule = schedules.find((s) => s.dayOfWeek === day);
      const dayName = DAY_NAMES[day];

      if (!schedule || schedule.isClosed || !schedule.startTime || !schedule.endTime) {
        message += `*${dayName}*: Cerrado\n`;
      } else {
        message += `*${dayName}*: ${schedule.startTime} a ${schedule.endTime}\n`;
      }
    }

    const sunSchedule = schedules.find((s) => s.dayOfWeek === DayOfWeek.SUNDAY);
    if (sunSchedule && !sunSchedule.isClosed && sunSchedule.startTime && sunSchedule.endTime) {
      message += `\n*Domingo*: ${sunSchedule.startTime} a ${sunSchedule.endTime}`;
    } else {
      message += `\n*Domingo*: Cerrado`;
    }

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
