import { MaxLength, MinLength } from "class-validator";

export class PrivatePasswordDto {
	@MaxLength(50, { message: "Old password must be shorter than or equal to 50 characters." })
	@MinLength(8, { message: "Old password must be longer than or equal to 8 characters." })
	old_password: string;

	@MaxLength(50, { message: "New password must be shorter than or equal to 50 characters." })
	@MinLength(8, { message: "New password must be longer than or equal to 8 characters." })
	new_password: string;

	@MaxLength(50, {
		message: "Confirm new password must be shorter than or equal to 50 characters.",
	})
	@MinLength(8, { message: "Confirm new password must be longer than or equal to 8 characters." })
	confirm_new_password: string;
}
