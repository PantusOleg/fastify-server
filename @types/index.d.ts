import * as utils from "metautil";
import {
  PrismaClient,
  User,
  NotificationToken,
  Session,
  Event,
} from "@prisma/client";
import { Session as SessionManager } from "../src/auth/session";
import { UsersService } from "../src/users/users.service";

export type Utils = typeof utils;

declare module "fastify" {
  interface FastifyInstance {
    db: PrismaClient;
    utils: Utils;
    config: Config;
    session: SessionManager;
    users: UsersService;
  }
  interface FastifyRequest {
    session: Session;
  }
}

export type UsersTable = PrismaClient["user"];
export type NotificationTokensTable = PrismaClient["notificationToken"];
export type SessionsTable = PrismaClient["session"];
export type EventsTable = PrismaClient["event"];
export type LocationsTable = PrismaClient["location"];
export type EventMembersTable = PrismaClient["eventMember"];

export { User, NotificationToken, Session, Event };

export type Config = {
  session: {
    characters: string;
    length: number;
    secret: string;
  };
  cookie: string;
};
