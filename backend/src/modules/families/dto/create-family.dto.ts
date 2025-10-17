import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateFamilyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name!: string;
}
