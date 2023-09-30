import { UserToken } from "@prisma/client";

export interface UserTokensCache {
	[key: string]: UserTokenCache;
}

export interface UserTokenCache extends UserToken {
	expired: number;
}
