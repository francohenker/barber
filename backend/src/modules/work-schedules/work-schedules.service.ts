import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkSchedule } from './entities/work-schedule.entity';
import {
  CreateWorkScheduleDto,
  UpdateWorkScheduleDto,
  BulkUpdateScheduleDto,
} from './dto/create-work-schedule.dto';

@Injectable()
export class WorkSchedulesService {
  constructor(
    @InjectRepository(WorkSchedule)
    private readonly schedulesRepo: Repository<WorkSchedule>,
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

    return this.schedulesRepo.save(schedule);
  }

  async update(id: string, dto: UpdateWorkScheduleDto): Promise<WorkSchedule> {
    const existing = await this.schedulesRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Horario no encontrado');

    await this.schedulesRepo.update(id, dto);
    const updated = await this.schedulesRepo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('Horario no encontrado');
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

      if (existing) {
        await this.schedulesRepo.update(existing.id, s);
        const updated = await this.schedulesRepo.findOne({
          where: { id: existing.id },
        });
        if (updated) results.push(updated);
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
        const saved = await this.schedulesRepo.save(created);
        results.push(saved);
      }
    }

    return results;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.schedulesRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Horario no encontrado');
    await this.schedulesRepo.delete(id);
  }
}
