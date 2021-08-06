import { PrismaClient } from "@prisma/client";
import { FastifyLoggerInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  Config,
  SessionsTable,
  Utils,
  Session as SessionModel,
} from "../../@types";

type Cookie = { sessionId: string; token: string };

export class Session {
  private readonly sessions: SessionsTable;

  constructor(
    private readonly db: PrismaClient,
    private readonly utils: Utils,
    private readonly logger: FastifyLoggerInstance,
    private readonly config: Config
  ) {
    this.sessions = db.session;
  }

  private createToken() {
    const { secret, characters, length } = this.config.session;
    return this.utils.generateToken(secret, characters, length);
  }

  private parseCookie(cookie: string) {
    return this.utils.parseCookies(cookie) as Cookie;
  }

  private find(cookie?: string) {
    if (!cookie) return;
    const { sessionId, token } = this.parseCookie(cookie);
    if (!sessionId || !token) return;
    return this.sessions.findFirst({
      where: { sessionId: +sessionId, token },
    });
  }

  private create(userId: number) {
    const token = this.createToken();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 2);
    const data = { token, userId, expiresAt };
    try {
      return this.sessions.create({ data });
    } catch (err) {
      this.logger.error(err);
      throw new Error("Failed to create session");
    }
  }

  private setCookie(reply: FastifyReply, session: SessionModel) {
    const { sessionId, token, expiresAt } = session;
    const cookie =
      `sessionId=${sessionId};token=${token};` +
      `expiresAt=${expiresAt.toISOString()}`;
    reply.raw.setHeader("Set-Cookie", cookie);
  }

  async start(reply: FastifyReply, userId: number) {
    const session = await this.create(userId);
    this.setCookie(reply, session);
  }

  async validate(req: FastifyRequest) {
    const session = await this.find(req.headers.cookie);
    if (!session) return false;
    const expired = session.expiresAt.getTime() < Date.now();
    if (expired) return false;
    req.session = session;
    return true;
  }

  async restore(req: FastifyRequest, reply: FastifyReply) {
    const session = await this.find(req.headers.cookie);
    if (!session) return false;
    const createNew = this.create(session.userId);
    const deletePrev = this.sessions.delete({
      where: { sessionId: session.sessionId },
    });
    const t = [createNew, deletePrev];
    const [newSession] = await this.db.$transaction(t);
    this.setCookie(reply, newSession);
    return true;
  }
}
