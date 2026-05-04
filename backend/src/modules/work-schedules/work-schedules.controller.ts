import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { WorkSchedulesService } from './work-schedules.service';
import {
  CreateWorkScheduleDto,
  UpdateWorkScheduleDto,
  BulkUpdateScheduleDto,
} from './dto/create-work-schedule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth.types';

@Controller('work-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkSchedulesController {
  constructor(private readonly schedulesService: WorkSchedulesService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.schedulesService.findByUserId(user.id);
  }

  @Get('barber/:barberId')
  async findByBarber(@Param('barberId') barberId: string) {
    return this.schedulesService.findByUserId(barberId);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateWorkScheduleDto) {
    return this.schedulesService.create(dto);
  }

  @Post('bulk/:barberId')
  @Roles(Role.ADMIN)
  bulkUpdate(
    @Param('barberId') barberId: string,
    @Body('schedules') schedules: Omit<BulkUpdateScheduleDto, 'userId'>[],
  ) {
    return this.schedulesService.bulkUpdate(barberId, schedules);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateWorkScheduleDto) {
    return this.schedulesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}
