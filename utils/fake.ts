import * as faker from "faker";
import { Prisma } from "@prisma/client";

type CreateUser = Prisma.UserCreateInput;

export class Fake {
  static user(password: string): CreateUser {
    return {
      email: faker.internet.email(),
      avatar: faker.image.image(),
      userName: faker.internet.userName(),
      fullName: faker.name.firstName() + faker.name.lastName(),
      sports: [faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
      about: faker.lorem.paragraph(),
      password,
    };
  }

  private static basicEvent = (creatorId: number) => ({
    creatorId,
    title: faker.name.title(),
    photo: faker.image.imageUrl(600, 400, "sports", true),
    about: faker.lorem.paragraph(),
    sports: ["tennis", faker.lorem.word(6), faker.lorem.word(6)],
    date: faker.date.soon(faker.datatype.number(100)),
    private: false,
    maxMembersCount: 100,
  });

  private static location = () => ({
    latitude: faker.datatype.float({ min: 0, max: 100 }),
    longitude: faker.datatype.number({ min: 0, max: 100 }),
    info: faker.lorem.slug(),
  });

  private static members(create = false) {
    return Array.from({
      length: faker.datatype.number({ min: 1, max: 5 }),
    }).map(() => {
      const userId = faker.datatype.number({ min: 1, max: 100 });
      return create ? { userId } : userId;
    });
  }

  static event(creatorId: number) {
    return { ...this.basicEvent(creatorId), location: this.location() };
  }

  static createEvent(creatorId: number) {
    return { ...this.event(creatorId), members: this.members() };
  }

  static prismaEvent(creatorId: number) {
    const members = this.members(true);
    return {
      ...this.basicEvent(creatorId),
      location: { create: this.location() },
      members: { createMany: { data: members, skipDuplicates: true } },
      membersCount: members.length,
    };
  }
}
