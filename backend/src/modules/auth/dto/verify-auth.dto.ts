import { IsOptional, IsString } from 'class-validator';

export class VerifyAuthDto {
  @IsString()
  firebaseIdToken!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
