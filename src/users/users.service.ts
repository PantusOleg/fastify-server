import {
  NotificationTokensTable,
  SessionsTable,
  UsersTable,
  Utils,
} from "../../@types";
import { FastifyLoggerInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { UpdatePasswordData, UpdateUserData } from "./users.schema";

export class UsersService {
  private readonly users: UsersTable;
  private readonly sessions: SessionsTable;
  private readonly nTokens: NotificationTokensTable;

  constructor(
    private readonly db: PrismaClient,
    private readonly utils: Utils,
    private readonly logger: FastifyLoggerInstance
  ) {
    this.users = db.user;
    this.sessions = db.session;
    this.nTokens = db.notificationToken;
  }

  async findOne(id: number) {
    const user = await this.users.findUnique({ where: { id } });
    if (!user) throw new Error("User is not found");
    return user;
  }

  findByIds(id: number[]) {
    return this.users.findMany({ where: { id: { in: id } } });
  }

  search(query: string, offset: number, limit: number) {
    return this.users.findMany({
      where: {
        OR: [
          { userName: { contains: query } },
          { fullName: { contains: query } },
        ],
      },
      skip: offset,
      take: limit,
    });
  }

  async searchBySports(sports: string[], offset: number, limit: number) {
    return this.users.findMany({
      where: { sports: { hasSome: sports } },
      skip: offset,
      take: limit,
    });
  }

  findMostPopular(offset: number, limit: number) {
    return this.users.findMany({
      skip: offset,
      take: limit,
      orderBy: { followersCount: "desc" },
    });
  }

  async delete(id: number, password: string) {
    const user = await this.users.findUnique({
      where: { id },
      select: { password: true },
    });
    if (!user) throw new Error("User is not found");
    const correct = await this.utils.validatePassword(password, user.password);
    if (!correct) throw new Error("Password is incorrect");
    try {
      const opts = { where: { userId: id } };
      const deleteSessions = this.sessions.deleteMany(opts);
      const deleteExpoTokens = this.nTokens.deleteMany(opts);
      const deleteUser = this.users.delete({
        where: { id },
      });
      await this.db.$transaction([
        deleteSessions,
        deleteExpoTokens,
        deleteUser,
      ]);
    } catch (err) {
      this.logger.error(err.message);
      throw new Error("Failed to delete user");
    }
    return { message: "User is deleted" };
  }

  async update({ id, ...data }: UpdateUserData) {
    try {
      await this.users.update({ data, where: { id } });
    } catch (err) {
      this.logger.warn(err.message);
      throw new Error("Failed to update");
    }
    return { message: "User is updated" };
  }

  async updatePassword(data: UpdatePasswordData) {
    const { id, oldPassword, newPassword } = data;
    if (oldPassword === newPassword) {
      throw new Error("Passwords are equal!");
    }
    const user = await this.users.findUnique({
      where: { id },
      select: { password: true },
    });
    if (!user) throw new Error("User is not found");
    const correct = await this.utils.validatePassword(
      oldPassword,
      user.password
    );
    if (!correct) throw new Error("Wrong password");
    const password = await this.utils.hashPassword(newPassword);
    try {
      await this.users.update({
        where: { id },
        data: { password },
      });
    } catch (err) {
      this.logger.warn(err.message);
      throw new Error("Failed to update password");
    }
    return { message: "Password is updated" };
  }
}
