import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepo: Repository<Client>,
  ) {}

  async findOrCreate(dto: CreateClientDto): Promise<Client> {
    let client = await this.clientsRepo.findOne({ where: { phone: dto.phone } });
    if (!client) {
      client = this.clientsRepo.create(dto);
      client = await this.clientsRepo.save(client);
    }
    return client;
  }

  async findAll(): Promise<Client[]> {
    return this.clientsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientsRepo.findOne({ where: { id } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async findByPhone(phone: string): Promise<Client | null> {
    return this.clientsRepo.findOne({ where: { phone } });
  }
}
