import { UsersService } from "./users.service";
import {
  userSchema,
  usersSearchRes,
  DeletesUserQuery,
  deleteUserQuery,
  UpdateUserData,
  updateUserSchema,
  UpdatePasswordData,
  updatePasswordSchema,
} from "./users.schema";
import {
  idSchema,
  offsetLimitSchema,
  IdParam,
  OffsetLimit,
  messageSchema,
  SearchQuery,
  searchQuery,
  SearchBySportsQuery,
  searchBySportsQuery,
} from "../common/common.schema";
import { FastifyInstance } from "fastify";
import { Session } from "../../@types";
import { ForbiddenError } from "../common/errors";

export default async (fastify: FastifyInstance) => {
  const service = new UsersService(fastify.db, fastify.utils, fastify.log);

  fastify.decorate("users", service);

  const options = <Q>(querystring: Q) => ({
    schema: {
      querystring,
      response: { 200: usersSearchRes },
    },
  });

  const validateIsMe = (session: Session, id: number) => {
    const isMe = session.userId === id;
    if (!isMe) return new ForbiddenError("Access is denied");
  };

  fastify.get<{ Params: IdParam }>(
    "/users/:id",
    {
      schema: {
        params: idSchema,
        response: { 200: userSchema },
      },
    },
    (req) => service.findOne(req.params.id)
  );

  fastify.get<{ Querystring: SearchQuery }>(
    "/users/search",
    options(searchQuery),
    ({ query: { query, offset, limit } }) =>
      service.search(query, offset, limit)
  );

  fastify.get<{ Querystring: SearchBySportsQuery }>(
    "/users/searchBySports",
    options(searchBySportsQuery),
    ({ query: { sports, offset, limit } }) =>
      service.searchBySports(sports, offset, limit)
  );

  fastify.get<{ Querystring: OffsetLimit }>(
    "/users/popular",
    options(offsetLimitSchema),
    ({ query }) => service.findMostPopular(query.offset, query.limit)
  );

  fastify.delete<{ Querystring: DeletesUserQuery }>(
    "/users",
    {
      schema: {
        querystring: deleteUserQuery,
        response: { 200: messageSchema },
      },
      preHandler: async (req) => {
        validateIsMe(req.session, req.query.id);
      },
    },
    ({ query }) => service.delete(query.id, query.password)
  );

  fastify.patch<{ Body: UpdateUserData }>(
    "/users",
    {
      schema: {
        body: updateUserSchema,
        response: { 200: messageSchema },
      },
      preHandler: async (req) => {
        validateIsMe(req.session, req.body.id);
        if (Object.keys(req.body).length === 1) {
          return new Error("You should update at least one field");
        }
      },
    },
    (req) => service.update(req.body)
  );

  fastify.patch<{ Body: UpdatePasswordData }>(
    "/users/updatePassword",
    {
      schema: {
        body: updatePasswordSchema,
        response: { 200: messageSchema },
      },
      preHandler: async (req) => {
        validateIsMe(req.session, req.body.id);
      },
    },
    (req) => service.updatePassword(req.body)
  );
};
