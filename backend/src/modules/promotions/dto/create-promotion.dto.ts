import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsPositive,
  Length,
} from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  @Length(2, 200)
  title: string;

  @IsString()
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  discountPercent?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  discountAmount?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  sendViaWhatsapp?: boolean;

  @IsDateString()
  @IsOptional()
  scheduledSendAt?: string;
}
