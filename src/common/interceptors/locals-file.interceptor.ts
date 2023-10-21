import { FileInterceptor } from "@nestjs/platform-express";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  mixin,
  NestInterceptor,
  Type,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { diskStorage } from "multer";
import { Request } from "express";

interface LocalFilesInterceptorOptions {
  fieldName: string;
  path?: string;
  fileFilter?: MulterOptions["fileFilter"];
  limits?: MulterOptions["limits"];
}

function LocalFilesInterceptor(options: LocalFilesInterceptorOptions): Type<NestInterceptor> {
  @Injectable()
  class Interceptor implements NestInterceptor {
    constructor(private readonly configService: ConfigService) {}

    intercept(context: ExecutionContext, next: CallHandler) {
      const request = context.switchToHttp().getRequest<Request>();
      const userInfo = request?.userInfo;

      const filesDestination = this.configService.get<string>("UPLOADED_FILES_DESTINATION");
      const destination = filesDestination + options.path;

      const multerOptions: MulterOptions = {
        storage: diskStorage({
          destination,
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, userInfo?.id || uniqueSuffix + "-" + file.originalname);
          },
        }),
        fileFilter: options.fileFilter,
        limits: options.limits,
      };
      return new (FileInterceptor(options.fieldName, multerOptions))().intercept(context, next);
    }
  }
  return mixin(Interceptor);
}

export default LocalFilesInterceptor;
