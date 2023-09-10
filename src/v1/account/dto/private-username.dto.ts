import { IsAlphanumeric, MaxLength, MinLength } from "class-validator";

export class PrivateUserNameDto {
	@IsAlphanumeric()
	@MaxLength(15, { message: "New username must be shorter than or equal to 15 characters." })
	@MinLength(3, { message: "New username must be longer than or equal to 3 characters." })
	new_username: string;

	@MaxLength(50, { message: "Confirm password must be shorter than or equal to 50 characters." })
	@MinLength(8, { message: "Confirm password must be longer than or equal to 8 characters." })
	confirm_password?: string;
}
