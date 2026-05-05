import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PromotionStatus } from '../../../common/enums/promotion.enum';
import { User } from '../../users/entities/user.entity';

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'discount_percent',
  })
  discountPercent: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'discount_amount',
  })
  discountAmount: number;

  @Column({ nullable: true, name: 'image_url' })
  imageUrl: string;

  @Column({ type: 'jsonb', nullable: true, name: 'target_client_ids' })
  targetClientIds: string[];

  @Column({
    type: 'enum',
    enum: PromotionStatus,
    default: PromotionStatus.DRAFT,
  })
  status: PromotionStatus;

  @Column({ name: 'send_via_whatsapp', default: false })
  sendViaWhatsapp: boolean;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'scheduled_send_at',
    comment: 'Fecha y hora de envío programado por WhatsApp',
  })
  scheduledSendAt: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'sent_at',
    comment: 'Fecha y hora en que fue enviado efectivamente',
  })
  sentAt: Date;

  @ManyToOne(() => User, (user) => user.promotions, { eager: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
