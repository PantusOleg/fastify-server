import fastify, { FastifyServerOptions } from "fastify";
import { errorHandler } from "./src/common/errors";

export const build = (
  opts: FastifyServerOptions = { logger: { prettyPrint: true } }
) => {
  const app = fastify(opts);

  app.setErrorHandler((err, _, reply) => errorHandler(err, reply));

  app.register(import("fastify-redis"));
  app.register(import("./plugins/prisma"));
  app.register(import("./plugins/utils"));
  app.register(import("./plugins/session"));

  app.register(import("./src/auth/auth.routes"));
  app.register(import("./src/users/users.routes"));
  app.register(import("./src/events/events.routes"));

  return app;
};
