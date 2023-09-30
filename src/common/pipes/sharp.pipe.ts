import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import * as path from "path";
import * as sharp from "sharp";
import * as fs from "fs";
import { ConfigService } from "@nestjs/config";

export interface SharpFile extends Express.Multer.File {
	staticPath: string;
	hostPath: string;
}

@Injectable()
export class SharpPipe implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>> {
	constructor(private readonly configService: ConfigService) {}
	async transform(file: Express.Multer.File): Promise<SharpFile> {
		if (!file) return null;

		const filename = Date.now() + "-" + file?.filename + ".webp";

		await sharp(file?.path)
			.toFormat("webp")
			.webp({ quality: 80, alphaQuality: 80 })
			.resize({
				width: 400,
				height: 400,
				fit: "cover",
				position: "center",
			})
			.toFile(path.join(file?.destination, filename))
			.catch(() => {
				throw new BadRequestException("Cannot process image");
			})
			.finally(() => {
				if (fs.existsSync(file?.path)) fs.unlinkSync(file.path);
			});

		return {
			...file,
			filename,
			staticPath: file?.destination.replace(this.configService.get<string>("UPLOADED_FILES_DESTINATION"), "") + "/" + filename,
			hostPath: file?.destination + "/" + filename,
		};
	}
}
