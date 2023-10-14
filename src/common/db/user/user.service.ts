import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";
import { Prisma, User } from "@prisma/client";

@Injectable()
export class UserService {
	constructor(private prismaService: PrismaService) {}

	public async findUnique(params: { where: Prisma.UserWhereUniqueInput; include?: Prisma.UserInclude; select?: Prisma.UserSelect }) {
		try {
			return await this.prismaService.user.findUnique({
				...params,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error fetching user", {
				cause: error,
			});
		}
	}

	public async findFirst(params: {
		skip?: number;
		cursor?: Prisma.UserWhereUniqueInput;
		where?: Prisma.UserWhereInput;
		orderBy?: Prisma.UserOrderByWithRelationInput;
		include?: Prisma.UserInclude;
	}) {
		try {
			return await this.prismaService.user.findFirst({
				...params,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error fetching user", {
				cause: error,
			});
		}
	}

	async findMany(params: {
		skip?: number;
		take?: number;
		cursor?: Prisma.UserWhereUniqueInput;
		where?: Prisma.UserWhereInput;
		orderBy?: Prisma.UserOrderByWithRelationInput;
	}): Promise<User[]> {
		const { skip, take, cursor, where, orderBy } = params;
		try {
			return await this.prismaService.user.findMany({
				...params,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error fetching users", {
				cause: error,
			});
		}
	}

	async create(data: Prisma.UserCreateInput) {
		try {
			return await this.prismaService.user.create({
				data,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error creating user", {
				cause: error,
			});
		}
	}

	async update(params: { where: Prisma.UserWhereUniqueInput; data: Prisma.UserUpdateInput }): Promise<User> {
		try {
			return await this.prismaService.user.update({
				...params,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error updating user", {
				cause: error,
			});
		}
	}

	async delete(where: Prisma.UserWhereUniqueInput) {
		try {
			return await this.prismaService.user.delete({
				where,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error deleting user", {
				cause: error,
			});
		}
	}
}
