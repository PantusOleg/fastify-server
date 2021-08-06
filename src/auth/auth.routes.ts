import { FastifyInstance, FastifyReply } from "fastify";
import { User } from "../../@types";
import { messageSchema } from "../common/common.schema";
import {
  CreateUserData,
  createUserSchema,
  userSchema,
} from "../users/users.schema";
import { LoginData, loginSchema } from "./auth.schema";
import { AuthService } from "./auth.service";

export default async (fastify: FastifyInstance) => {
  const service = new AuthService(
    fastify.db.user,
    fastify.db.notificationToken,
    fastify.log,
    fastify.utils
  );

  const withSession =
    <B>(fn: (data: B) => Promise<User | Error>) =>
    async (req: { body: B }, reply: FastifyReply) => {
      const res = await fn(req.body);
      if (res instanceof Error) return res;
      await fastify.session.start(reply, res.id);
      return res;
    };

  fastify.post<{ Body: LoginData }>(
    "/auth/login",
    {
      schema: {
        body: loginSchema,
        response: { 200: userSchema },
      },
    },
    withSession(service.login.bind(service))
  );

  fastify.post<{ Body: CreateUserData }>(
    "/auth/register",
    {
      schema: {
        body: createUserSchema,
        response: { 200: userSchema },
      },
    },
    withSession(service.register.bind(service))
  );

  fastify.get(
    "/auth/restoreSession",
    { schema: { response: { 200: messageSchema } } },
    async (req, reply) => {
      const success = await fastify.session.restore(req, reply);
      if (!success) return new Error("Failed to restore session");
      return { message: "Session is restored" };
    }
  );
};
