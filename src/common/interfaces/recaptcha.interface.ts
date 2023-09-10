export interface RecaptchaV3Response {
	success: boolean;
	challenge_ts: string;
	hostname: string;
	score: number;
	action: string;
	"error-codes": string[];
}
