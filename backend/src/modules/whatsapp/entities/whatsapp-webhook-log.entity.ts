import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { MessageDirection } from '../../../common/enums/message-direction.enum';

@Entity('whatsapp_webhook_logs')
export class WhatsappWebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: MessageDirection,
  })
  direction: MessageDirection;

  @Column({ nullable: true, name: 'wa_message_id' })
  waMessageId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
