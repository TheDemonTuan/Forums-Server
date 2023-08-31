import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {V1Module} from './v1/v1.module';
import {CacheInterceptor, CacheModule} from '@nestjs/cache-manager';
import {APP_INTERCEPTOR} from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    V1Module,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule { }
