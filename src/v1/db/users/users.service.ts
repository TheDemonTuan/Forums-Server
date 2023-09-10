import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma, User } from "@prisma/client";

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}

	async findUnique(
		userWhereUniqueInput: Prisma.UserWhereUniqueInput,
		userSelect?: Prisma.UserSelect
	): Promise<User | null> {
		try {
			return await this.prisma.user.findUnique({
				where: userWhereUniqueInput,
				select: userSelect,
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
		const { skip, cursor, where, orderBy, include } = params;
		try {
			return await this.prisma.user.findFirst({
				skip,
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

	async findMany(params: {
		skip?: number;
		take?: number;
		cursor?: Prisma.UserWhereUniqueInput;
		where?: Prisma.UserWhereInput;
		orderBy?: Prisma.UserOrderByWithRelationInput;
	}): Promise<User[]> {
		const { skip, take, cursor, where, orderBy } = params;
		try {
			return await this.prisma.user.findMany({
				skip,
				take,
				cursor,
				where,
				orderBy,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error fetching users", {
				cause: error,
			});
		}
	}

	async create(data: Prisma.UserCreateInput) {
		try {
			return await this.prisma.user.create({
				data,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error creating user", {
				cause: error,
			});
		}
	}

	async update(params: {
		where: Prisma.UserWhereUniqueInput;
		data: Prisma.UserUpdateInput;
	}): Promise<User> {
		const { where, data } = params;
		try {
			return await this.prisma.user.update({
				data,
				where,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error updating user", {
				cause: error,
			});
		}
	}

	async deleteUser(where: Prisma.UserWhereUniqueInput) {
		try {
			return await this.prisma.user.delete({
				where,
			});
		} catch (error) {
			throw new InternalServerErrorException("Error deleting user", {
				cause: error,
			});
		}
	}
}
