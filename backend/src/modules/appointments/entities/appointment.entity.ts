import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  AppointmentStatus,
  AppointmentSource,
} from '../../../common/enums/appointment.enum';
import { Client } from '../../clients/entities/client.entity';
import { Service } from '../../services/entities/service.entity';
import { User } from '../../users/entities/user.entity';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({
    type: 'enum',
    enum: AppointmentSource,
    default: AppointmentSource.WEB,
  })
  source: AppointmentSource;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Client, (client) => client.appointments, { eager: true })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Service, (service) => service.appointments, { eager: true })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => User, (user) => user.appointments, { eager: true })
  @JoinColumn({ name: 'barber_id' })
  barber: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
