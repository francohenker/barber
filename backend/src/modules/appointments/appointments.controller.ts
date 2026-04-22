import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /** Public: book an appointment (guest) */
  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  /** Public: get available slots */
  @Get('slots')
  getSlots(
    @Query('date') date: string,
    @Query('barberId') barberId: string,
    @Query('duration') duration: string,
  ) {
    return this.appointmentsService.getAvailableSlots(date, barberId, Number(duration));
  }

  /** Admin/Barber: list appointments */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('date') date?: string) {
    return this.appointmentsService.findAll(date);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.appointmentsService.updateStatus(id, dto);
  }
}
