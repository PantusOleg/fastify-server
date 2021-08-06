import { PrismaClient } from "@prisma/client";
import { FastifyLoggerInstance } from "fastify";
import {
  EventMembersTable,
  EventsTable,
  LocationsTable,
  UsersTable,
} from "../../@types";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../common/errors";
import { CreateEventData, UpdateEventData } from "./events.schema";

export class EventsService {
  private readonly users: UsersTable;
  private readonly events: EventsTable;
  private readonly locations: LocationsTable;
  private readonly eventMembers: EventMembersTable;

  constructor(
    private readonly db: PrismaClient,
    private readonly logger: FastifyLoggerInstance
  ) {
    this.users = db.user;
    this.events = db.event;
    this.locations = db.location;
    this.eventMembers = this.db.eventMember;
  }

  private include = { creator: true, location: true };

  async findOne(id: number) {
    const event = await this.events.findUnique({
      where: { id },
      include: this.include,
    });
    if (!event) return new NotFoundError();
    return event;
  }

  test() {
    return this.users.findUnique({
      where: { id: 1 },
      include: { createdEvents: true },
    });
  }

  search(query: string, offset: number, limit: number) {
    return this.events.findMany({
      where: { title: { contains: query }, private: false },
      skip: offset,
      take: limit,
      orderBy: { date: "desc" },
      include: this.include,
    });
  }

  searchBySports(sports: string[], offset: number, limit: number) {
    return this.events.findMany({
      where: { sports: { hasSome: sports }, private: false },
      skip: offset,
      take: limit,
      orderBy: { date: "desc" },
      include: this.include,
    });
  }

  findByCreator(
    creatorId: number,
    offset: number,
    limit: number,
    userId: number
  ) {
    const isCreator = userId === creatorId;
    return this.events.findMany({
      where: isCreator ? { creatorId } : { creatorId, private: false },
      skip: offset,
      take: limit,
      include: this.include,
      orderBy: { createdAt: "desc" },
    });
  }

  getCreatedEventsCount(creatorId: number) {
    return this.events.count({ where: { creatorId } });
  }

  searchByLocation(latitude: number, longitude: number, distance: number) {
    const distanceInDegrees = distance / 111;
    return this.events.findMany({
      where: {
        location: {
          latitude: {
            gte: latitude - distanceInDegrees,
            lte: latitude + distanceInDegrees,
          },
          longitude: {
            gte: longitude - distanceInDegrees,
            lte: longitude + distanceInDegrees,
          },
        },
        private: false,
      },
      take: 30,
      include: this.include,
      orderBy: { date: "desc" },
    });
  }

  async create(data: CreateEventData, creatorId: number) {
    const { maxMembersCount, members, location } = data;
    if (maxMembersCount && members.length > maxMembersCount) {
      const message = `Max members count is ${maxMembersCount}`;
      return new BadRequestError(message);
    }
    try {
      return this.events.create({
        data: {
          ...data,
          creatorId,
          membersCount: members.length,
          location: { create: location },
          members: {
            createMany: {
              data: members.map((userId) => ({ userId })),
              skipDuplicates: true,
            },
          },
        },
        include: this.include,
      });
    } catch (err) {
      this.logger.error(err.message);
      throw new Error("Failed to create event");
    }
  }

  async delete(id: number, userId: number) {
    const event = await this.events.findUnique({
      where: { id },
      include: { location: true },
    });

    if (!event) return new NotFoundError();
    if (event.creatorId !== userId) return new ForbiddenError();

    const deleteLocation = this.locations.delete({
      where: { id: event.location?.id },
    });
    const deleteMembers = this.eventMembers.deleteMany({
      where: { eventId: id },
    });
    const deleteEvent = this.events.delete({ where: { id } });

    try {
      await this.db.$transaction([deleteMembers, deleteLocation, deleteEvent]);
      return { message: "Event is deleted" };
    } catch (err) {
      this.logger.error(err.message);
      return new Error("failed to create event");
    }
  }

  async update({ id, location, ...data }: UpdateEventData, userId: number) {
    if (Object.keys(data).length === 0 && !location) {
      return new BadRequestError("Update at least 1 field");
    }
    const event = await this.events.findUnique({
      where: { id },
      include: { location: { select: { id: true } } },
    });
    if (!event) {
      return new NotFoundError();
    }
    if (event.creatorId !== userId) {
      return new ForbiddenError();
    }
    const updateEvent = this.events.update({
      data,
      where: { id },
      select: { id: true },
    });
    try {
      if (location && event.location) {
        const updateLocation = this.locations.update({
          data: location,
          where: { id: event.location.id },
        });
        await this.db.$transaction([updateEvent, updateLocation]);
      }
    } catch (err) {
      this.logger.error(err);
      return new Error("Failed to update event");
    }
    return { message: "Updated" };
  }
}
