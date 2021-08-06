import { Type, Static } from "@sinclair/typebox";

export const idSchema = Type.Object({
  id: Type.Integer(),
});

export type IdParam = Static<typeof idSchema>;

export const offsetLimitSchema = Type.Object({
  offset: Type.Integer({ minimum: 0 }),
  limit: Type.Integer({ minimum: 0, maximum: 50 }),
});

export type OffsetLimit = Static<typeof offsetLimitSchema>;

export const messageSchema = Type.Object({
  message: Type.String(),
});

export const searchQuery = Type.Object({
  query: Type.String(),
  ...offsetLimitSchema.properties,
});

export const searchBySportsQuery = Type.Object({
  sports: Type.Array(Type.String()),
  ...offsetLimitSchema.properties,
});

export type SearchQuery = Static<typeof searchQuery>;
export type SearchBySportsQuery = Static<typeof searchBySportsQuery>;
