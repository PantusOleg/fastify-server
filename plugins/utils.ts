import plugin from "fastify-plugin";
import * as utils from "metautil";
import { FastifyInstance } from "fastify";

export default plugin(async (fastify: FastifyInstance) => {
  fastify.decorate("utils", utils);
});
