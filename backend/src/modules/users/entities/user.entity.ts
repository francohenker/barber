import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Promotion } from '../../promotions/entities/promotion.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Column({ nullable: true, unique: true, name: 'google_id' })
  googleId: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'enum', enum: Role, default: Role.BARBER })
  role: Role;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ nullable: true, name: 'refresh_token', select: false })
  refreshToken: string;

  @OneToMany(() => Appointment, (appointment) => appointment.barber)
  appointments: Appointment[];

  @OneToMany(() => Promotion, (promotion) => promotion.createdBy)
  promotions: Promotion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
