import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import compression from "@fastify/compress";
import fastifyCookie from "@fastify/cookie";

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter({
			trustProxy: true,
		})
	);

	await app.register(compression, { encodings: ["gzip", "deflate"] });
	await app.register(fastifyCookie, {
		secret: process.env["COOKIE_SECRET"] ?? "secret", // for cookies signature
	});

	app.enableCors({
		origin: ["http://localhost:3001"],
		credentials: true,
	});

	await app.listen(3000);
}
bootstrap();
