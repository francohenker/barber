import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { User } from '../users/entities/user.entity';
import { AppointmentStatus } from '../../common/enums/appointment.enum';

@Injectable()
export class BarbersService {
  constructor(
    private readonly usersService: UsersService,
    private readonly appointmentsService: AppointmentsService,
    private readonly whatsappService: WhatsappService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersService.findAllBarbers();
  }

  async findActive(): Promise<User[]> {
    return this.usersService.findActiveBarbers();
  }

  async create(dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    return this.usersService.update(id, dto);
  }

  async softDelete(id: string): Promise<void> {
    // 1. Mark as inactive
    await this.usersService.update(id, { isActive: false });

    // 2. Find future appointments
    const futureAppts = await this.appointmentsService.getFutureAppointments(id);

    // 3. Cancel and notify
    for (const appt of futureAppts) {
      await this.appointmentsService.updateStatus(appt.id, { status: AppointmentStatus.CANCELLED });
      
      if (appt.client && appt.client.phone) {
        const message = `Hola ${appt.client.name}, lamentamos informarte que tu turno para el ${appt.date} a las ${appt.startTime} ha sido cancelado debido a que el barbero ya no se encuentra disponible. Por favor, ingresa a http://localhost:3000/book para reprogramar con otro profesional. Disculpa las molestias.`;
        await this.whatsappService.sendTextMessage(appt.client.phone, message);
      }
    }
  }
}
