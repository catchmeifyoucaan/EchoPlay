import { IsEnum, IsOptional, IsString } from 'class-validator';

import { Mode } from '../../../types/match.types';

export class CreateMatchDto {
  @IsEnum(Mode)
  mode!: Mode;

  @IsOptional()
  @IsString()
  topic?: string;
}
