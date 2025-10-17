import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class StartMatchDto {
  @IsOptional()
  @IsString()
  speakerUserId?: string;

  @IsOptional()
  @IsInt()
  @Min(30)
  durationSec?: number;
}
