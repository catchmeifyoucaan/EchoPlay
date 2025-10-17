import { IsOptional, IsString } from 'class-validator';

export class TranscribeDto {
  @IsString()
  audioUrl!: string;

  @IsOptional()
  @IsString()
  language?: string;
}
