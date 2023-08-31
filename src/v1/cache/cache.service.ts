import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { User, UserToken } from "@prisma/client";
import { Cache } from "cache-manager";

@Injectable()
export class CacheService {
	constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

	//--------------------------------------------------------------------------UserInfo--------------------------------------------------------------------------
	private uiCacheName = "tdt_user:";

	public setUserInfo(userInfo: User) {
		return this.cacheManager.set(this.uiCacheName + userInfo.id, userInfo, 1800000);
	}

	public getUserInfo(uiid: string) {
		return this.cacheManager.get<User>(this.uiCacheName + uiid);
	}

	public delUserInfo(uuid: string) {
		return this.cacheManager.del(this.uiCacheName + uuid);
	}

	//--------------------------------------------------------------------------UserToken--------------------------------------------------------------------------
	private utCacheName = "tdt_token:";

	public setUserToken(userToken: UserToken) {
		return this.cacheManager.set(this.utCacheName + userToken.id, userToken, 1800000);
	}

	public getUserToken(utid: string) {
		return this.cacheManager.get<UserToken>(this.utCacheName + utid);
	}

	public delUserToken(utid: string) {
		return this.cacheManager.del(this.utCacheName + utid);
	}

	//--------------------------------------------------------------------------UserInfo And UserToken--------------------------------------------------------------------------

	public setUTAUI(userInfo: User, userToken: UserToken) {
		return Promise.all([this.setUserInfo(userInfo), this.setUserToken(userToken)]);
	}

	public delUTAUI(uiid: string, utid: string) {
		return Promise.all([this.delUserInfo(uiid), this.delUserToken(utid)]);
	}
}
