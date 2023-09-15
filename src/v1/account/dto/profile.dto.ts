/* eslint-disable prettier/prettier */
import { IsAlphanumeric, IsOptional, MaxLength, MinLength } from 'class-validator';

export class ProfileDto {

  @IsOptional()
  avatar: string;

  @IsAlphanumeric()
  @MaxLength(25, {
    message: 'Display name must be shorter than or equal to 25 characters.',
  })
  @MinLength(3, {
    message: 'Display name must be longer than or equal to 3 characters.',
  })
  display_name: string;

  @MaxLength(255, {
    message: 'About must be shorter than or equal to 255 characters.',
  })
  @MinLength(0, {
    message: 'About must be longer than or equal to 0 characters.',
  })
  about: string;
}
