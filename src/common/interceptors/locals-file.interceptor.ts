/* eslint-disable prettier/prettier */
import { FileInterceptor } from "@nestjs/platform-express";
import { CallHandler, ExecutionContext, Injectable, mixin, NestInterceptor, Type } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { diskStorage } from "multer";

interface LocalFilesInterceptorOptions {
	fieldName: string;
	path?: string;
	fileFilter?: MulterOptions["fileFilter"];
	limits?: MulterOptions["limits"];
}

function LocalFilesInterceptor(options: LocalFilesInterceptorOptions): Type<NestInterceptor> {
	@Injectable()
	class Interceptor implements NestInterceptor {
		private fileInterceptor: NestInterceptor;
		constructor(private readonly configService: ConfigService) {
			const filesDestination = configService.get<string>("UPLOADED_FILES_DESTINATION");

			const destination = filesDestination + options.path;

			const multerOptions: MulterOptions = {
				storage: diskStorage({
					destination,
				}),
				fileFilter: options.fileFilter,
				limits: options.limits,
			};

			this.fileInterceptor = new (FileInterceptor(options.fieldName, multerOptions))();
		}

		intercept(context: ExecutionContext, next: CallHandler) {
			return this.fileInterceptor.intercept(context, next);
		}
	}
	return mixin(Interceptor);
}

export default LocalFilesInterceptor;
