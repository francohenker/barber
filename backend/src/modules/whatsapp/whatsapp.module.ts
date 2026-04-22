import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappWebhookLog } from './entities/whatsapp-webhook-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WhatsappWebhookLog])],
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
