import { Type, Static } from "@sinclair/typebox";

export const loginSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 6, maxLength: 20 }),
  expoPushToken: Type.Optional(Type.String()),
});

/* export const loginWithFirebaseSchema = {
  type: "object",
  properties: {
    idToken: { type: "string" },
    expoPushToken: { type: "string" },
  },
  required: ["idToken"],
} as const; */

export type LoginData = Static<typeof loginSchema>;
//export type LoginWithFBData = FromSchema<typeof loginWithFirebaseSchema>;
