import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import {
  CreateAppointmentDto,
  UpdateAppointmentStatusDto,
} from './dto/create-appointment.dto';
import { ClientsService } from '../clients/clients.service';
import { ServicesService } from '../services/services.service';
import { UsersService } from '../users/users.service';
import { WorkSchedulesService } from '../work-schedules/work-schedules.service';
import { AppointmentSource } from '../../common/enums/appointment.enum';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepo: Repository<Appointment>,
    private readonly clientsService: ClientsService,
    private readonly servicesService: ServicesService,
    private readonly usersService: UsersService,
    private readonly workSchedulesService: WorkSchedulesService,
  ) {}

  async create(
    dto: CreateAppointmentDto,
    source: AppointmentSource = AppointmentSource.WEB,
  ): Promise<Appointment> {
    const [client, service, barber] = await Promise.all([
      this.clientsService.findOne(dto.clientId),
      this.servicesService.findOne(dto.serviceId),
      this.usersService.findOne(dto.barberId),
    ]);

    // Calculate endTime based on service duration
    const [hours, minutes] = dto.startTime.split(':').map(Number);
    const startDate = new Date(2000, 0, 1, hours, minutes);
    startDate.setMinutes(startDate.getMinutes() + service.duration);
    const endTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;

    // Check for slot conflicts
    const conflict = await this.appointmentsRepo
      .createQueryBuilder('a')
      .where('a.date = :date', { date: dto.date })
      .andWhere('a.barber_id = :barberId', { barberId: dto.barberId })
      .andWhere('a.status NOT IN (:...excluded)', { excluded: ['CANCELLED'] })
      .andWhere('a.start_time < :endTime AND a.end_time > :startTime', {
        startTime: dto.startTime,
        endTime,
      })
      .getOne();

    if (conflict) {
      throw new BadRequestException(
        'El horario seleccionado no está disponible',
      );
    }

    const appointment = this.appointmentsRepo.create({
      date: dto.date,
      startTime: dto.startTime,
      endTime,
      notes: dto.notes,
      source,
      client,
      service,
      barber,
    });

    return this.appointmentsRepo.save(appointment);
  }

  async findAll(date?: string): Promise<Appointment[]> {
    const query = this.appointmentsRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.client', 'client')
      .leftJoinAndSelect('a.service', 'service')
      .leftJoinAndSelect('a.barber', 'barber')
      .orderBy('a.date', 'ASC')
      .addOrderBy('a.startTime', 'ASC');

    if (date) {
      query.where('a.date = :date', { date });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Appointment> {
    const appt = await this.appointmentsRepo.findOne({ where: { id } });
    if (!appt) throw new NotFoundException('Turno no encontrado');
    return appt;
  }

  async updateStatus(
    id: string,
    dto: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    await this.findOne(id);
    await this.appointmentsRepo.update(id, { status: dto.status });
    return this.findOne(id);
  }

  async getAvailableSlots(
    date: string,
    barberId: string,
    serviceDuration: number,
  ): Promise<string[]> {
    // Get day of week from date (0=Sunday, 1=Monday, ... 6=Saturday)
    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();

    // Get barber's work schedule for this day
    const schedule = await this.workSchedulesService.findByUserAndDay(
      barberId,
      dayOfWeek,
    );

    // If no schedule exists or day is closed, return empty
    if (!schedule || schedule.isClosed) {
      return [];
    }

    if (!schedule.startTime || !schedule.endTime) {
      return [];
    }

    // Parse work hours
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const workStart = startH * 60 + startM;
    const workEnd = endH * 60 + endM;

    // Get booked appointments
    const booked = await this.appointmentsRepo.find({
      where: { date, barber: { id: barberId } },
      select: ['startTime', 'endTime'],
    });

    // Generate slots every 60 minutes
    const slots: string[] = [];

    for (let min = workStart; min + serviceDuration <= workEnd; min += 60) {
      const sh = Math.floor(min / 60);
      const sm = min % 60;
      const eh = Math.floor((min + serviceDuration) / 60);
      const em = (min + serviceDuration) % 60;
      const start = `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
      const end = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

      const hasConflict = booked.some(
        (b) => b.startTime < end && b.endTime > start,
      );
      if (!hasConflict) slots.push(start);
    }

    return slots;
  }
}
