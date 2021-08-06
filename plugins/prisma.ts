import plugin from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

export default plugin(async (fastify: FastifyInstance) => {
  const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
    errorFormat: "pretty",
  });
  try {
    await prisma.$connect();
  } catch (err) {
    fastify.log.error(`Database connection failed ${err.message}`);
  }
  fastify.decorate("db", prisma);
  fastify.addHook("onClose", () => prisma.$disconnect());
});
