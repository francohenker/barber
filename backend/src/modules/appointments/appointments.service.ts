import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
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
import { AppointmentSource, AppointmentStatus } from '../../common/enums/appointment.enum';

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
      status: AppointmentStatus.CONFIRMED,
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

    // Parse work hours for first shift
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const workStart = startH * 60 + startM;
    const workEnd = endH * 60 + endM;

    // Optional second shift
    let workStart2: number | null = null;
    let workEnd2: number | null = null;
    if (schedule.startTime2 && schedule.endTime2) {
      const [startH2, startM2] = schedule.startTime2.split(':').map(Number);
      const [endH2, endM2] = schedule.endTime2.split(':').map(Number);
      workStart2 = startH2 * 60 + startM2;
      workEnd2 = endH2 * 60 + endM2;
    }

    // Get booked appointments
    const booked = await this.appointmentsRepo.find({
      where: { date, barber: { id: barberId } },
      select: ['startTime', 'endTime'],
    });

    // Generate slots every 60 minutes
    const slots: string[] = [];

    // Helper to generate slots for a specific range
    const generateForRange = (startMin: number, endMin: number) => {
      for (let min = startMin; min + serviceDuration <= endMin; min += 60) {
        const sh = Math.floor(min / 60);
        const sm = min % 60;
        const eh = Math.floor((min + serviceDuration) / 60);
        const em = (min + serviceDuration) % 60;
        const start = `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
        const end = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

        const hasConflict = booked.some(
          (b) => b.startTime < end && b.endTime > start,
        );
        if (!hasConflict && !slots.includes(start)) slots.push(start);
      }
    };

    generateForRange(workStart, workEnd);
    if (workStart2 !== null && workEnd2 !== null) {
      generateForRange(workStart2, workEnd2);
    }

    return slots;
  }

  async getFutureAppointments(barberId: string): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.appointmentsRepo.find({
      where: {
        barber: { id: barberId },
      },
      relations: ['client', 'service', 'barber'],
    }).then(appts => appts.filter(a => a.date >= today && a.status !== AppointmentStatus.CANCELLED));
  }

  @Cron(CronExpression.EVERY_HOUR)
  async autoCompleteAppointments() {
    const now = new Date();
    
    // Getting local date string YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;
    
    // Getting local time string HH:MM
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const localTime = `${hours}:${minutes}`;

    const pastAppointments = await this.appointmentsRepo
      .createQueryBuilder('a')
      .where('a.status = :status', { status: AppointmentStatus.CONFIRMED })
      .andWhere('(a.date < :today OR (a.date = :today AND a.end_time <= :time))', { 
        today: localDate, 
        time: localTime 
      })
      .getMany();

    if (pastAppointments.length > 0) {
      const ids = pastAppointments.map(a => a.id);
      await this.appointmentsRepo.update(ids, { status: AppointmentStatus.COMPLETED });
      console.log(`[Cron] Auto-completed ${pastAppointments.length} appointments at ${localDate} ${localTime}`);
    }
  }
}
