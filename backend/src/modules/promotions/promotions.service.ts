import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Promotion } from './entities/promotion.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { PromotionStatus } from '../../common/enums/promotion.enum';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ClientsService } from '../clients/clients.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionsRepo: Repository<Promotion>,
    private readonly whatsappService: WhatsappService,
    private readonly clientsService: ClientsService,
  ) {}

  async create(dto: CreatePromotionDto, user: User): Promise<Promotion> {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden crear promociones');
    }

    const status = dto.scheduledSendAt ? PromotionStatus.SCHEDULED : PromotionStatus.DRAFT;
    const promotion = this.promotionsRepo.create({
      ...dto,
      status,
      createdBy: user,
      scheduledSendAt: dto.scheduledSendAt ? new Date(dto.scheduledSendAt) : undefined,
    });

    return this.promotionsRepo.save(promotion) as Promise<Promotion>;
  }

  async findAll(): Promise<Promotion[]> {
    return this.promotionsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findActive(): Promise<Promotion[]> {
    return this.promotionsRepo.find({
      where: { status: PromotionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Promotion> {
    const p = await this.promotionsRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Promoción no encontrada');
    return p;
  }

  async update(id: string, dto: Partial<CreatePromotionDto>, user: User): Promise<Promotion> {
    if (user.role !== Role.ADMIN) throw new ForbiddenException();
    await this.findOne(id);
    await this.promotionsRepo.update(id, {
      ...dto,
      scheduledSendAt: dto.scheduledSendAt ? new Date(dto.scheduledSendAt) : undefined,
    });
    return this.findOne(id);
  }

  async remove(id: string, user: User): Promise<void> {
    if (user.role !== Role.ADMIN) throw new ForbiddenException();
    await this.findOne(id);
    await this.promotionsRepo.delete(id);
  }

  /** Send a promotion immediately to all clients via WhatsApp */
  async sendNow(id: string, user: User): Promise<Promotion> {
    if (user.role !== Role.ADMIN) throw new ForbiddenException();
    const promotion = await this.findOne(id);
    await this.sendToAllClients(promotion);
    return this.findOne(id);
  }

  /** Cron: check every minute for promotions to send */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledPromotions(): Promise<void> {
    const pending = await this.promotionsRepo.find({
      where: {
        status: PromotionStatus.SCHEDULED,
        sendViaWhatsapp: true,
        sentAt: IsNull(),
        scheduledSendAt: LessThanOrEqual(new Date()),
      },
    });

    for (const promotion of pending) {
      await this.sendToAllClients(promotion);
    }
  }

  private async sendToAllClients(promotion: Promotion): Promise<void> {
    const clients = await this.clientsService.findAll();
    const clientsWithPhone = clients.filter((c) => c.phone);

    const message = this.buildPromotionMessage(promotion);

    await Promise.allSettled(
      clientsWithPhone.map((client) =>
        this.whatsappService.sendTextMessage(client.phone, message),
      ),
    );

    await this.promotionsRepo.update(promotion.id, {
      sentAt: new Date(),
      status: PromotionStatus.ACTIVE,
    });
  }

  private buildPromotionMessage(promotion: Promotion): string {
    let msg = `✂️ *${promotion.title}*\n\n${promotion.description}`;
    if (promotion.discountPercent) {
      msg += `\n\n🏷️ *${promotion.discountPercent}% de descuento*`;
    } else if (promotion.discountAmount) {
      msg += `\n\n🏷️ *$${promotion.discountAmount} de descuento*`;
    }
    msg += '\n\n📱 Reservá tu turno en nuestra web o respondiendo este mensaje.';
    return msg;
  }
}
