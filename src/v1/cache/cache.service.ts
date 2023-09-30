import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { User, UserToken } from "@prisma/client";
import { Cache } from "cache-manager";
import { UserTokensCache } from "./interfaces/user-token-cache.interface";

@Injectable()
export class CacheService {
	constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

	//--------------------------------------------------------------------------UserInfo--------------------------------------------------------------------------
	private uiCacheName = "tdt_user:";
	private uiCacheTime = 300000;

	public setUserInfo(userInfo: User) {
		return this.cacheManager.set(this.uiCacheName + userInfo.id, userInfo, this.uiCacheTime);
	}

	public getUserInfo(uiid: string) {
		return this.cacheManager.get<User>(this.uiCacheName + uiid);
	}

	public delUserInfo(uuid: string) {
		return this.cacheManager.del(this.uiCacheName + uuid);
	}

	//--------------------------------------------------------------------------UserToken--------------------------------------------------------------------------
	private utCacheName = "tdt_token:";
	private utCacheTime = 300000;

	public async setUserToken(uuid: string, userToken: UserToken) {
		const userTokens = (await this.getUserTokens(uuid)) ?? {};
		return this.cacheManager.set(
			this.utCacheName + uuid,
			{ [userToken?.id]: { ...userToken, expired: new Date().getTime() + this.utCacheTime }, ...userTokens },
			this.utCacheTime
		);
	}

	public async getUserToken(uuid: string, utid: string) {
		const userTokens = await this.getUserTokens(uuid);
		return userTokens?.[utid];
	}

	public async getUserTokens(uuid: string) {
		let userTokens = await this.cacheManager.get<UserTokensCache>(this.utCacheName + uuid);
		for (const key in userTokens) {
			if (userTokens.hasOwnProperty(key) && userTokens[key].expired < new Date().getTime()) delete userTokens[key];
		}
		return userTokens;
	}

	public async delUserToken(uuid: string, utid: string) {
		const userTokens = await this.getUserTokens(uuid);
		delete userTokens?.[utid];
		return this.cacheManager.set(this.utCacheName + uuid, userTokens, this.utCacheTime);
	}

	public delUserTokens(uuid: string) {
		return this.cacheManager.del(this.utCacheName + uuid);
	}

	//--------------------------------------------------------------------------UserInfo And UserToken--------------------------------------------------------------------------

	public async setUTAUI(userInfo: User, userToken: UserToken) {
		return await Promise.all([this.setUserInfo(userInfo), this.setUserToken(userInfo?.id, userToken)]);
	}

	public async delUTAUI(currentUIID: string, currentUTID: string) {
		return await Promise.all([this.delUserInfo(currentUIID), this.delUserToken(currentUIID, currentUTID)]);
	}
}
