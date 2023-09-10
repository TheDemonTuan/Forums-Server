import { Global, Module } from "@nestjs/common";
import { CacheModule } from "../cache/cache.module";
import { CacheService } from "../cache/cache.service";
import { UsersModule } from "../db/users/users.module";
import { UserTokensModule } from "../db/user-tokens/user-tokens.module";
import { UserTokensService } from "../db/user-tokens/user-tokens.service";
import { UsersService } from "../db/users/users.service";

@Global()
@Module({
	imports: [CacheModule, UsersModule, UserTokensModule],
	providers: [CacheService, UsersService, UserTokensService],
	exports: [CacheService, UsersService, UserTokensService],
})
export class GlobalsModule {}
