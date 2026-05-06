import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from './entities/appointment.entity';
import { ClientsModule } from '../clients/clients.module';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';
import { WorkSchedulesModule } from '../work-schedules/work-schedules.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    ClientsModule,
    ServicesModule,
    UsersModule,
    forwardRef(() => WorkSchedulesModule),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
