import { FastifyInstance } from "fastify";
import {
  IdParam,
  idSchema,
  messageSchema,
  SearchBySportsQuery,
  searchBySportsQuery,
  searchQuery,
  SearchQuery,
} from "../common/common.schema";
import {
  CreateEventData,
  createEventSchema,
  eventSchema,
  eventsSchema,
  FindByCreatorParams,
  findByCreatorParams,
  findByLocationParams,
  FindByLocationParams,
  UpdateEventData,
  updateEventSchema,
} from "./events.schema";
import { EventsService } from "./events.service";

export default async (fastify: FastifyInstance) => {
  const service = new EventsService(fastify.db, fastify.log);

  const options = <Q>(querystring: Q) => ({
    schema: {
      querystring,
      response: { 200: eventsSchema },
    },
  });

  fastify.get("/test", () => service.test())

  fastify.get<{ Params: IdParam }>(
    "/events/:id",
    {
      schema: {
        params: idSchema,
        response: { 200: eventSchema },
      },
    },
    async (req) => service.findOne(req.params.id)
  );

  fastify.get<{ Querystring: SearchQuery }>(
    "/events/search",
    options(searchQuery),
    ({ query: { query, offset, limit } }) =>
      service.search(query, offset, limit)
  );

  fastify.get<{ Querystring: SearchBySportsQuery }>(
    "/events/searchBySports",
    options(searchBySportsQuery),
    ({ query: { sports, offset, limit } }) =>
      service.searchBySports(sports, offset, limit)
  );

  fastify.get<{ Querystring: FindByCreatorParams }>(
    "/events/creator",
    options(findByCreatorParams),
    ({ query: { creatorId, offset, limit }, session }) =>
      service.findByCreator(creatorId, offset, limit, session.userId)
  );

  fastify.get<{ Querystring: FindByLocationParams }>(
    "/events/location",
    options(findByLocationParams),
    ({ query: { latitude, longitude, distance } }) =>
      service.searchByLocation(latitude, longitude, distance)
  );

  fastify.post<{ Body: CreateEventData }>(
    "/events",
    {
      schema: {
        body: createEventSchema,
        response: { 200: eventSchema },
      },
    },
    (req) => service.create(req.body, req.session.userId)
  );

  fastify.delete<{ Params: IdParam }>(
    "/events/:id",
    {
      schema: {
        params: idSchema,
        response: { 200: messageSchema },
      },
    },
    (req) => service.delete(req.params.id, req.session.userId)
  );

  fastify.patch<{ Body: UpdateEventData }>(
    "/events",
    {
      schema: {
        body: updateEventSchema,
        response: { 200: messageSchema },
      },
    },
    (req) => service.update(req.body, req.session.userId)
  );
};
