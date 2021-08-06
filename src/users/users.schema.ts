import { Static, Type } from "@sinclair/typebox";

export const userSchema = Type.Object({
  id: Type.Integer(),
  email: Type.String(),
  userName: Type.String(),
  avatar: Type.String(),
  fullName: Type.String(),
  about: Type.String(),
  sports: Type.Array(Type.String()),
  followersCount: Type.Integer(),
});

export type UserType = Static<typeof userSchema>;

export const usersSearchRes = Type.Array(userSchema);

export const validateUserSchema = Type.Object({
  email: Type.String({ format: "email", minLength: 5, maxLength: 55 }),
  userName: Type.String({ minLength: 3, maxLength: 30 }),
  avatar: Type.String({ format: "url" }),
  fullName: Type.String({ minLength: 5, maxLength: 50 }),
  about: Type.String({ minLength: 1, maxLength: 1000 }),
  sports: Type.Array(Type.String({ minLength: 2, maxLength: 30 })),
});

export const createUserSchema = Type.Object({
  ...validateUserSchema.properties,
  password: Type.String({ minLength: 6, maxLength: 20 }),
  expoPushToken: Type.Optional(Type.String()),
});

export type CreateUserData = Static<typeof createUserSchema>;

export const updateUserSchema = Type.Object({
  id: Type.Integer(),
  ...Type.Partial(validateUserSchema).properties,
});

export type UpdateUserData = Static<typeof updateUserSchema>;

export const updatePasswordSchema = Type.Object({
  id: Type.Integer(),
  oldPassword: Type.String({ minLength: 6, maxLength: 20 }),
  newPassword: Type.String({ minLength: 6, maxLength: 20 }),
});

export type UpdatePasswordData = Static<typeof updatePasswordSchema>;

export const deleteUserQuery = Type.Object({
  id: Type.Integer(),
  password: Type.String({ minLength: 6, maxLength: 20 }),
});

export type DeletesUserQuery = Static<typeof deleteUserQuery>;
