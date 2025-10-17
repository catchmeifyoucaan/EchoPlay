import { IsDateString, IsOptional, IsString, MaxLength, IsObject } from 'class-validator';

export class CreateTournamentDto {
  @IsString()
  @MaxLength(128)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsObject()
  bracket?: Record<string, unknown>;
}
