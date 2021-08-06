import { Static, Type } from "@sinclair/typebox";
import { offsetLimitSchema } from "../common/common.schema";
import { userSchema } from "../users/users.schema";

export const findByCreatorParams = Type.Object({
  creatorId: Type.Integer(),
  ...offsetLimitSchema.properties,
});

export type FindByCreatorParams = Static<typeof findByCreatorParams>;

const coordsSchema = Type.Object({
  latitude: Type.Number(),
  longitude: Type.Number(),
});

export const findByLocationParams = Type.Object({
  ...coordsSchema.properties,
  distance: Type.Number(),
});

export type FindByLocationParams = Static<typeof findByLocationParams>;

const locationSchema = Type.Object({
  ...coordsSchema.properties,
  info: Type.Optional(Type.String()),
});

export const eventSchema = Type.Object({
  id: Type.Integer(),
  creator: userSchema,
  title: Type.String(),
  about: Type.String(),
  sports: Type.Array(Type.String()),
  photo: Type.String(),
  video: Type.Optional(Type.String()),
  date: Type.String(),
  private: Type.Boolean(),
  likesCount: Type.Integer(),
  membersCount: Type.Integer(),
  commentsCount: Type.Integer(),
  maxMembersCount: Type.Integer(),
  location: locationSchema,
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const eventsSchema = Type.Array(eventSchema);

export const validateEventSchema = Type.Object({
  title: Type.String({ minLength: 3, maxLength: 200 }),
  about: Type.String({ minLength: 3, maxLength: 1000 }),
  sports: Type.Array(Type.String({ minLength: 3, maxLength: 30 }), {
    uniqueItems: true,
  }),
  photo: Type.String({ format: "uri" }),
  video: Type.Optional(Type.String()),
  date: Type.String({ format: "date-time" }),
  private: Type.Optional(Type.Boolean()),
  maxMembersCount: Type.Integer(),
  location: locationSchema,
});

export const createEventSchema = Type.Object({
  members: Type.Array(Type.Integer()),
  ...validateEventSchema.properties,
});

export const updateEventSchema = Type.Object({
  id: Type.Integer(),
  ...Type.Partial(validateEventSchema).properties,
});

export type EventSchema = Static<typeof eventSchema>;

export type CreateEventData = Static<typeof createEventSchema>;  

export type UpdateEventData = Static<typeof updateEventSchema>;
