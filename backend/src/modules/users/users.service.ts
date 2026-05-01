import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('El email ya está registrado');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({ ...dto, password: hash });
    return this.usersRepo.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find();
  }

  async findAllBarbers(): Promise<User[]> {
    return this.usersRepo.find({ where: { role: Role.BARBER } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { googleId } });
  }

  async findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.refreshToken')
      .where('user.id = :id', { id })
      .getOne();
  }

  async linkGoogleAccount(
    id: string,
    googleId: string,
    avatar?: string,
  ): Promise<User> {
    await this.usersRepo.update(id, {
      googleId,
      ...(avatar ? { avatar } : {}),
    });
    return this.findOne(id);
  }

  async createFromGoogle(googleUser: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<User> {
    const user = this.usersRepo.create({
      email: googleUser.email,
      name: googleUser.name,
      googleId: googleUser.googleId,
      avatar: googleUser.avatar,
      role: Role.BARBER,
    });
    return this.usersRepo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findOne(id);
    const updateData: any = { ...dto };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    await this.usersRepo.update(id, updateData);
    return this.findOne(id);
  }

  async updateRefreshToken(id: string, hashedRt: string): Promise<void> {
    await this.usersRepo.update(id, { refreshToken: hashedRt });
  }

  async clearRefreshToken(id: string): Promise<void> {
    await this.usersRepo.update(id, { refreshToken: undefined });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.usersRepo.delete(id);
  }
}
