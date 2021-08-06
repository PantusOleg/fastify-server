import { Fake } from "../utils/fake";
import { hashPassword } from "metautil";
import { PrismaClient, PrismaPromise } from "@prisma/client";

const prisma = new PrismaClient();

const seed = async () => {
  const password = await hashPassword("NA$At00r");
  const admin = await prisma.user.create({
    data: {
      ...Fake.user(password),
      email: "pantus@oleg.com",
      userName: "olezha",
      sports: ["volleyball", "running"],
    },
  });
  await prisma.user.createMany({
    data: Array.from({ length: 100 }).map(() => Fake.user(password)),
    skipDuplicates: true,
  });
  const createEvents: PrismaPromise<any>[] = [];
  for (let i = 0; i < 100; i++) {
    createEvents.push(
      prisma.event.create({
        data: Fake.event(admin.id),
        select: { id: true },
      })
    );
  }
  await prisma.$transaction(createEvents);
};

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(prisma.$disconnect);
