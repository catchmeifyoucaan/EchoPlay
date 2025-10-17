import { IsString, MaxLength } from 'class-validator';

export class ModerateTextDto {
  @IsString()
  @MaxLength(1000)
  text!: string;
}
