import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { PartialType } from '@nestjs/mapped-types';

class UpdateServiceDto extends PartialType(CreateServiceDto) {}

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepo: Repository<Service>,
  ) {}

  async create(dto: CreateServiceDto): Promise<Service> {
    const service = this.servicesRepo.create(dto);
    return this.servicesRepo.save(service);
  }

  async findAll(onlyActive = false): Promise<Service[]> {
    const where = onlyActive ? { isActive: true } : {};
    return this.servicesRepo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.servicesRepo.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return service;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    await this.findOne(id);
    await this.servicesRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.servicesRepo.delete(id);
  }
}
