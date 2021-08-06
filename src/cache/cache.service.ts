import { FastifyLoggerInstance } from "fastify";
import { Redis } from "ioredis";
import { EventsTable, UsersTable } from "../../@types";

export class CacheService {
  private readonly array = Array.from({ length: 10 }).map((_, i) => i);

  constructor(
    private readonly cache: Redis,
    private readonly users: UsersTable,
    private readonly events: EventsTable,
    private readonly logger: FastifyLoggerInstance
  ) {}

  private getRandom(except: number[]) {
    const acceptable =
      except.length > 0
        ? this.array.filter((i) => !except.includes(i))
        : this.array;

    return {
      moreItemsAvailable: acceptable.length > 0,
      random: acceptable[Math.floor(Math.random() * acceptable.length)],
    };
  }

  async getRandomItems(except: number[], name: string) {
    const { random, moreItemsAvailable } = this.getRandom(except);
    return {
      items: moreItemsAvailable
        ? await this.cache.get(name + "/" + random)
        : [],
      portion: random,
    };
  }

  getRandomUsers(except: number[]) {
    return this.getRandomItems(except, "users");
  }

  getRandomEvents(except: number[]) {
    return this.getRandomItems(except, "events");
  }

  setToCache<I>(items: I[], batchLength: number, name: string) {
    const promises: Promise<unknown>[] = [];
    for (let u = 0; u <= items.length; u += batchLength) {
      promises.push(
        this.cache.set(
          name + "/" + u / batchLength,
          items.slice(u, u + batchLength)
        )
      );
    }
    return promises;
  }

  async initCache() {
    try {
      const before = new Date().getTime();
      const [users, events] = await Promise.all([
        this.users.findMany({ take: 150 }),
        this.events.findMany({
          where: { private: false },
          take: 100,
          include: { creator: true, location: true },
        }),
      ]);

      await Promise.allSettled([
        ...this.setToCache(users, 15, "user"),
        ...this.setToCache(events, 10, "events"),
      ]);

      const after = new Date().getTime();

      this.logger.info(`Cache successfully initialized: ${after - before} ms`);
    } catch (err) {
      this.logger.error(err.message);
    }
  }

  isUserOnline(id: number) {
    return this.cache.get(`onlineUsers/${id}`);
  }

  async setUserIsOnline(id: number, isOnline: boolean) {
    if (isOnline) {
      await this.cache.set(`onlineUsers/${id}`, 1);
    } else {
      await this.cache.del(`onlineUsers/${id}`);
    }
  }

  /* async setChatNotificationTokens(
    chatId: number,
    notificationTokens: NotificationToken[]
  ) {
    await this.cache.set(`notificationTokens/${chatId}`, notificationTokens);
  } */

  /*  @Cron(CronExpression.EVERY_30_MINUTES)
  async updateCache() {
    return await this.initCache();
  } */
}
