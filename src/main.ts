import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import { join } from "path";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		cors: {
			origin: [process.env.CLIENT_URL],
			credentials: true,
		},
	});

	app.useStaticAssets(join(process.cwd(), "public"));
	app.use(compression());
	app.use(cookieParser(process.env["COOKIE_SECRET"] ?? "secret"));
	app.set("trust proxy", 1);

	await app.listen(process.env.PORT || 3000);
}
bootstrap();
