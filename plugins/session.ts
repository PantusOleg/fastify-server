import dotenv from "dotenv";
import plugin from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { Session } from "../src/auth/session";
import { Config } from "../@types";
import { UnauthorizedError } from "../src/common/errors";

const allowed: Record<string, boolean> = {
  "/auth/login": true,
  "/auth/register": true,
  "/test": true,
};

export default plugin(async (fastify: FastifyInstance) => {
  const { parsed: env } = dotenv.config();

  if (!env) throw new Error("Failed to load config");

  const config: Config = {
    session: {
      characters: env.SESSION_CHARACTERS,
      length: +env.SESSION_TOKEN_LENGTH,
      secret: env.SESSION_SECRET,
    },
    cookie: env.COOKIE,
  };

  const { db, utils, log } = fastify;
  const session = new Session(db, utils, log, config);

  fastify.decorate("config", config);
  fastify.decorate("session", session);

  fastify.addHook("preValidation", async (req) => {
    if (allowed[req.url]) return;
    const correct = await session.validate(req);
    if (!correct) throw new UnauthorizedError();
  });
});
