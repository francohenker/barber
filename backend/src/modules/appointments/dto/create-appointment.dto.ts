import {
  IsString,
  IsDateString,
  IsUUID,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { AppointmentStatus } from '../../../common/enums/appointment.enum';

export class CreateAppointmentDto {
  @IsDateString()
  date: string;

  @IsString()
  startTime: string;

  @IsUUID()
  clientId: string;

  @IsUUID()
  serviceId: string;

  @IsUUID()
  barberId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
