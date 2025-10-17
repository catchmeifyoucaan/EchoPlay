import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateKidDto {
  @IsString()
  @MaxLength(64)
  displayName!: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  familyId?: string;
}
