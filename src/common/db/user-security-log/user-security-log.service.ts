import { PrismaService } from "@/common/prisma/prisma.service";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";

@Injectable()
export class UserSecurityLogService {
	constructor(private readonly prismaService: PrismaService) {}

	public async findUnique(params: { where: Prisma.UserSecurityLogWhereUniqueInput; include?: Prisma.UserSecurityLogInclude; select?: Prisma.UserSecurityLogSelect }) {
		try {
			return await this.prismaService.userSecurityLog.findUnique({
				...params,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error fetching user security log", {
				cause: error,
			});
		}
	}

	public async findFirst(params: {
		skip?: number;
		cursor?: Prisma.UserSecurityLogWhereUniqueInput;
		where?: Prisma.UserSecurityLogWhereInput;
		orderBy?: Prisma.UserSecurityLogOrderByWithRelationInput;
		include?: Prisma.UserSecurityLogInclude;
	}) {
		try {
			return await this.prismaService.userSecurityLog.findFirst({
				...params,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error fetching user security log", {
				cause: error,
			});
		}
	}

	public async findMany(params: {
		skip?: number;
		take?: number;
		cursor?: Prisma.UserSecurityLogWhereUniqueInput;
		where?: Prisma.UserSecurityLogWhereInput;
		orderBy?: Prisma.UserSecurityLogOrderByWithRelationInput;
	}) {
		try {
			return await this.prismaService.userSecurityLog.findMany({
				...params,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error fetching user security log", {
				cause: error,
			});
		}
	}

	public async create(data: Prisma.UserSecurityLogCreateInput) {
		try {
			return await this.prismaService.userSecurityLog.create({
				data,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error creating user security log", {
				cause: error,
			});
		}
	}
	async update(params: { where: Prisma.UserSecurityLogWhereUniqueInput; data: Prisma.UserSecurityLogUpdateInput }) {
		try {
			return await this.prismaService.userSecurityLog.update({
				...params,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error updating user security log", {
				cause: error,
			});
		}
	}

	async delete(where: Prisma.UserSecurityLogWhereUniqueInput) {
		try {
			return await this.prismaService.userSecurityLog.delete({
				where,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error deleting user security log", {
				cause: error,
			});
		}
	}

	async deleteMany(where: Prisma.UserSecurityLogWhereInput) {
		try {
			return await this.prismaService.userSecurityLog.deleteMany({
				where,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error deleting user security log", {
				cause: error,
			});
		}
	}
}
