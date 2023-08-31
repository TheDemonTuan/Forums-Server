import { PrismaService } from "@/prisma/prisma.service";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Prisma, UserToken } from "@prisma/client";
import { randomBytes } from "crypto";

@Injectable()
export class UserTokensService {
	constructor(private readonly prisma: PrismaService) {}

	public async createToken(ip: string, user_id: string) {
		try {
			let userToken: UserToken = await this.findFirst({
				where: {
					user_id,
					ip,
				},
			});

			if (!userToken) {
				userToken = await this.create({
					id: randomBytes(27).toString("base64url"),
					ip,
					user: {
						connect: {
							id: user_id,
						},
					},
				});
			}

			return userToken;
		} catch (error) {
			throw new InternalServerErrorException("Error creating token", {
				cause: error,
			});
		}
	}

	public async findUnique(params: {
		where: Prisma.UserTokenWhereUniqueInput;
		include?: Prisma.UserTokenInclude;
		select?: Prisma.UserTokenSelect;
	}) {
		try {
			return await this.prisma.userToken.findUnique({
				...params,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error fetching user token", {
				cause: error,
			});
		}
	}

	public async findFirst(params: {
		skip?: number;
		cursor?: Prisma.UserTokenWhereUniqueInput;
		where?: Prisma.UserTokenWhereInput;
		orderBy?: Prisma.UserTokenOrderByWithRelationInput;
		include?: Prisma.UserTokenInclude;
	}) {
		const { skip, cursor, where, orderBy, include } = params;
		try {
			return await this.prisma.userToken.findFirst({
				skip,
				cursor,
				where,
				orderBy,
				include,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error fetching users token", {
				cause: error,
			});
		}
	}

	public async findMany(params: {
		skip?: number;
		take?: number;
		cursor?: Prisma.UserTokenWhereUniqueInput;
		where?: Prisma.UserTokenWhereInput;
		orderBy?: Prisma.UserTokenOrderByWithRelationInput;
		include?: Prisma.UserTokenInclude;
	}) {
		const { skip, take, cursor, where, orderBy, include } = params;
		try {
			return await this.prisma.userToken.findMany({
				skip,
				take,
				cursor,
				where,
				orderBy,
				include,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error fetching users", {
				cause: error,
			});
		}
	}

	public async create(data: Prisma.UserTokenCreateInput) {
		try {
			return await this.prisma.userToken.create({
				data,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error creating token", {
				cause: error,
			});
		}
	}

	// async updateUser(params: {
	//   where: Prisma.UserWhereUniqueInput;
	//   data: Prisma.UserUpdateInput;
	// }): Promise<User> {
	//   const { where, data } = params;
	//   try {
	//     return await this.prisma.user.update({
	//       data,
	//       where,
	//     });
	//   } catch (error) {
	//     throw new InternalServerErrorException("Error updating user", {
	//       cause: error,
	//     });
	//   }
	// }

	// async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
	//   try {
	//     return await this.prisma.user.delete({
	//       where,
	//     });
	//   } catch (error) {
	//     throw new InternalServerErrorException("Error deleting user", {
	//       cause: error,
	//     });
	//   }
	// }
}
