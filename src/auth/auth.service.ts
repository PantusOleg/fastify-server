import { UsersTable, NotificationTokensTable, Utils } from "../../@types";
import { LoginData } from "./auth.schema";
import { FastifyLoggerInstance } from "fastify";
import { CreateUserData } from "../users/users.schema";
import { BadRequestError } from "../common/errors";

export class AuthService {
  constructor(
    private readonly users: UsersTable,
    private readonly notificationTokens: NotificationTokensTable,
    private readonly logger: FastifyLoggerInstance,
    private readonly utils: Utils
  ) {}

  private async saveExpoToken(userId: number, expoPushToken?: string) {
    if (!expoPushToken) return;
    await this.notificationTokens
      .create({ data: { userId, expoPushToken } })
      .catch();
  }

  async login({ email, password, expoPushToken }: LoginData) {
    const user = await this.users.findUnique({ where: { email } });
    if (!user || !user.id) {
      throw new Error("Incorrect email or password");
    }
    const correct = await this.utils.validatePassword(password, user.password);
    if (!correct) {
      throw new Error("Incorrect email or password");
    }
    await this.saveExpoToken(user.id, expoPushToken);
    return user;
  }

  async register({ expoPushToken, password, ...data }: CreateUserData) {
    const exists = await this.users.findFirst({
      where: { OR: [{ email: data.email }, { userName: data.userName }] },
    });
    if (exists) {
      return new BadRequestError("Email and userName must be unique");
    }
    const hash = await this.utils.hashPassword(password);
    const user = await this.users
      .create({ data: { ...data, password: hash } })
      .catch((err) => {
        this.logger.error(err);
        throw new Error("Failed to create user");
      });
    await this.saveExpoToken(user.id, expoPushToken);
    return user;
  }
}
