import { IsString, IsOptional, IsEmail, Length } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @Length(7, 20)
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
