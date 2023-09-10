import { IsAlphanumeric, IsEmail, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
	@MaxLength(50, { message: "Email must be shorter than or equal to 50 characters." })
	@IsEmail(undefined, { message: "Email must be a valid email address." })
	email: string;

	@IsAlphanumeric(undefined, { message: "Username must be alphanumeric" })
	@MaxLength(15, { message: "Username must be shorter than or equal to 15 characters." })
	@MinLength(3, { message: "Username must be longer than or equal to 3 characters." })
	username: string;

	@MaxLength(50, { message: "Password must be shorter than or equal to 50 characters." })
	@MinLength(8, { message: "Password must be longer than or equal to 8 characters." })
	password: string;
}
