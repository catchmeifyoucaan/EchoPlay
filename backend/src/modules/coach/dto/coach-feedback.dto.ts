import { IsArray, IsOptional, IsString } from 'class-validator';

export class CoachFeedbackDto {
  @IsString()
  transcript!: string;

  @IsString()
  lang!: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @IsOptional()
  @IsString()
  matchId?: string;

  @IsOptional()
  @IsString()
  speakerId?: string;
}
