import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

@Entity('work_schedules')
@Unique(['user', 'dayOfWeek'])
export class WorkSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'day_of_week', type: 'int' })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'time', nullable: true, name: 'start_time' })
  startTime: string | null;

  @Column({ type: 'time', nullable: true, name: 'end_time' })
  endTime: string | null;

  @Column({ type: 'time', nullable: true, name: 'start_time_2' })
  startTime2: string | null;

  @Column({ type: 'time', nullable: true, name: 'end_time_2' })
  endTime2: string | null;

  @Column({ name: 'is_closed', default: false })
  isClosed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
