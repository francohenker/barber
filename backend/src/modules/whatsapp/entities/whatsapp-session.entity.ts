import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum WhatsappBotState {
  INIT = 'INIT',
  SELECT_DAY = 'SELECT_DAY',
  SELECT_TIME = 'SELECT_TIME',
  CONFIRM_BOOKING = 'CONFIRM_BOOKING',
}

@Entity('whatsapp_sessions')
export class WhatsappSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: WhatsappBotState,
    default: WhatsappBotState.INIT,
  })
  state: WhatsappBotState;

  @Column({ type: 'jsonb', nullable: true })
  bookingData: {
    selectedDay?: number;
    selectedDate?: string; // YYYY-MM-DD
    selectedTime?: string; // HH:mm
    barberId?: string;
    serviceId?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
