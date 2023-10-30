import { PrismaService } from "@/common/prisma/prisma.service";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";

@Injectable()
export class UserTokenService {
	constructor(private readonly prismaService: PrismaService) {}

	public async findUnique(params: { where: Prisma.UserTokenWhereUniqueInput; include?: Prisma.UserTokenInclude; select?: Prisma.UserTokenSelect }) {
		try {
			return await this.prismaService.userToken.findUnique({
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
		try {
			return await this.prismaService.userToken.findFirst({
				...params,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error fetching user token", {
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
	}) {
		try {
			return await this.prismaService.userToken.findMany({
				...params,
			});
		} catch (error) {
			console.log(error);
			
			throw new InternalServerErrorException("Error fetching user token", {
				cause: error,
			});
		}
	}

	public async create(data: Prisma.UserTokenCreateInput) {
		try {
			return await this.prismaService.userToken.create({
				data,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error creating user token", {
				cause: error,
			});
		}
	}
	async update(params: { where: Prisma.UserTokenWhereUniqueInput; data: Prisma.UserTokenUpdateInput }) {
		try {
			return await this.prismaService.userToken.update({
				...params,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error updating user token", {
				cause: error,
			});
		}
	}

	async delete(where: Prisma.UserTokenWhereUniqueInput) {
		try {
			return await this.prismaService.userToken.delete({
				where,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error deleting user token", {
				cause: error,
			});
		}
	}

	async deleteMany(where: Prisma.UserTokenWhereInput) {
		try {
			return await this.prismaService.userToken.deleteMany({
				where,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error deleting user token", {
				cause: error,
			});
		}
	}
}
