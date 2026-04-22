import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /** Public: register or find client (for guest booking) */
  @Post()
  findOrCreate(@Body() dto: CreateClientDto) {
    return this.clientsService.findOrCreate(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }
}
