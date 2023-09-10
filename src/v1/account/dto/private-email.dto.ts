import { IsEmail, MaxLength, MinLength } from "class-validator";

export class PrivateEmailDto {
	@MaxLength(50, { message: "New Email must be shorter than or equal to 50 characters." })
	@IsEmail(undefined, { message: "New mail must be a valid email address." })
	new_email: string;

	@MaxLength(50, { message: "Confirm new mail must be shorter than or equal to 50 characters." })
	@IsEmail(undefined, { message: "Confirm New email must be a valid email address." })
	confirm_new_email: string;

	@MaxLength(50, { message: "Confirm password must be shorter than or equal to 50 characters." })
	@MinLength(8, { message: "Confirm password must be longer than or equal to 8 characters." })
	confirm_password?: string;
}
