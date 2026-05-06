import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkSchedule } from './entities/work-schedule.entity';
import {
  CreateWorkScheduleDto,
  UpdateWorkScheduleDto,
  BulkUpdateScheduleDto,
} from './dto/create-work-schedule.dto';
import { AppointmentsService } from '../appointments/appointments.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { AppointmentStatus } from '../../common/enums/appointment.enum';

@Injectable()
export class WorkSchedulesService {
  constructor(
    @InjectRepository(WorkSchedule)
    private readonly schedulesRepo: Repository<WorkSchedule>,
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
    private readonly whatsappService: WhatsappService,
  ) {}

  async findByUserId(userId: string): Promise<WorkSchedule[]> {
    return this.schedulesRepo.find({
      where: { user: { id: userId } },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async findByUserAndDay(
    userId: string,
    dayOfWeek: number,
  ): Promise<WorkSchedule | null> {
    return this.schedulesRepo.findOne({
      where: { user: { id: userId }, dayOfWeek },
      relations: ['user'],
    });
  }

  async create(dto: CreateWorkScheduleDto): Promise<WorkSchedule> {
    const existing = await this.schedulesRepo.findOne({
      where: { user: { id: dto.userId }, dayOfWeek: dto.dayOfWeek },
    });

    if (existing) {
      return this.update(existing.id, {
        startTime: dto.startTime,
        endTime: dto.endTime,
        startTime2: dto.startTime2,
        endTime2: dto.endTime2,
        isClosed: dto.isClosed ?? false,
      });
    }

    const schedule = this.schedulesRepo.create({
      user: { id: dto.userId },
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime ?? null,
      endTime: dto.endTime ?? null,
      startTime2: dto.startTime2 ?? null,
      endTime2: dto.endTime2 ?? null,
      isClosed: dto.isClosed ?? false,
    });

    const saved = await this.schedulesRepo.save(schedule);
    await this.notifyAffectedClients(dto.userId, dto.dayOfWeek, saved);
    return saved;
  }

  async update(id: string, dto: UpdateWorkScheduleDto): Promise<WorkSchedule> {
    const existing = await this.schedulesRepo.findOne({ where: { id }, relations: ['user'] });
    if (!existing) throw new NotFoundException('Horario no encontrado');

    await this.schedulesRepo.update(id, dto);
    const updated = await this.schedulesRepo.findOne({ where: { id }, relations: ['user'] });
    if (!updated) throw new NotFoundException('Horario no encontrado');

    if (updated.user) {
      await this.notifyAffectedClients(updated.user.id, updated.dayOfWeek, updated);
    }
    
    return updated;
  }

  async bulkUpdate(
    userId: string,
    schedules: Omit<BulkUpdateScheduleDto, 'userId'>[],
  ): Promise<WorkSchedule[]> {
    const results: WorkSchedule[] = [];

    for (const s of schedules) {
      const existing = await this.schedulesRepo.findOne({
        where: { user: { id: userId }, dayOfWeek: s.dayOfWeek },
      });

      let updated: WorkSchedule | null = null;
      if (existing) {
        await this.schedulesRepo.update(existing.id, s);
        updated = await this.schedulesRepo.findOne({
          where: { id: existing.id },
        });
      } else {
        const created = this.schedulesRepo.create({
          user: { id: userId },
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime ?? null,
          endTime: s.endTime ?? null,
          startTime2: s.startTime2 ?? null,
          endTime2: s.endTime2 ?? null,
          isClosed: s.isClosed,
        });
        updated = await this.schedulesRepo.save(created);
      }

      if (updated) {
        results.push(updated);
        await this.notifyAffectedClients(userId, s.dayOfWeek, updated);
      }
    }

    return results;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.schedulesRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Horario no encontrado');
    await this.schedulesRepo.delete(id);
  }

  private async notifyAffectedClients(userId: string, dayOfWeek: number, schedule: WorkSchedule) {
    // 1. Get all future appointments for this barber and dayOfWeek within the next 7 days
    const appointments = await this.appointmentsService.getFutureAppointments(userId);
    
    // 2. Filter for the specific dayOfWeek and next 7 days
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const affected = appointments.filter(appt => {
      // Check if it's the same day of week
      const apptDate = new Date(appt.date + 'T12:00:00');
      if (apptDate.getDay() !== dayOfWeek) return false;
      
      // Limit to current week (next 7 days)
      if (appt.date > nextWeekStr) return false;

      // If closed, it's affected
      if (schedule.isClosed) return true;

      // If not closed, check if time is now outside work hours
      const isOutside = (time: string) => {
        const inFirstShift = schedule.startTime && schedule.endTime && (time >= schedule.startTime && time < schedule.endTime);
        const inSecondShift = schedule.startTime2 && schedule.endTime2 && (time >= schedule.startTime2 && time < schedule.endTime2);
        return !(inFirstShift || inSecondShift);
      };

      return isOutside(appt.startTime);
    });

    // 3. Cancel and notify
    for (const appt of affected) {
      await this.appointmentsService.updateStatus(appt.id, { status: AppointmentStatus.CANCELLED });
      
      if (appt.client && appt.client.phone) {
        const message = `Hola ${appt.client.name}, lamentamos informarte que tu turno para el ${appt.date} a las ${appt.startTime} ha sido cancelado debido a un cambio en el horario del barbero. Por favor, ingresa a http://localhost:3000/book para reprogramar. Disculpa las molestias.`;
        await this.whatsappService.sendTextMessage(appt.client.phone, message);
      }
    }
  }
}
