import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsBoolean,
  Length,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(5)
  duration: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
