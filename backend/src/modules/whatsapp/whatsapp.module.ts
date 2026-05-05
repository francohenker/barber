import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappWebhookLog } from './entities/whatsapp-webhook-log.entity';
import { WhatsappSession } from './entities/whatsapp-session.entity';
import { WorkSchedulesModule } from '../work-schedules/work-schedules.module';
import { UsersModule } from '../users/users.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ClientsModule } from '../clients/clients.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsappWebhookLog, WhatsappSession]),
    WorkSchedulesModule,
    UsersModule,
    forwardRef(() => AppointmentsModule),
    ClientsModule,
    ServicesModule,
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
