import { build } from "../../app";
import { Fake } from "../../utils/fake";

const app = build();

const inject = () => {
  const cookie = app.config.cookie;
  return app.inject().headers({ cookie });
};

describe("events", () => {
  beforeAll(app.ready);

  it("should get event", async () => {
    const res = await inject().get("/events/1");
    expect(res.statusCode).toEqual(200);
    expect(res.json().id).toBeDefined();
  });

  it("should search events", async () => {
    const res = await inject()
      .get("/users/search")
      .query({ query: "a", offset: 0, limit: 10 });
    expect(res.statusCode).toEqual(200);
    expect(res.json()[0].id).toBeDefined();
  });

  it("should search events by sport", async () => {
    const res = await inject()
      .get("/users/searchBySports")
      .query({ sports: ["running", "tennis"], offset: 0, limit: 10 });
    expect(res.statusCode).toEqual(200);
    expect(res.json()[0].id).toBeDefined();
  });

  it("should search events by creator", async () => {
    const res = await inject()
      .get("/events/creator")
      .query({ creatorId: 1, offset: 0, limit: 10 });
    expect(res.statusCode).toEqual(200);
    expect(res.json()[0].id).toBeDefined();
  });

  it("should search events by location", async () => {
    const res = await inject()
      .get("/events/location")
      .query({ latitude: 31.29, longitude: 50, distance: 100 });
    expect(res.statusCode).toEqual(200);
    expect(res.json()[0].id).toBeDefined();
  });

  it("should create and delete event", async () => {
    const res = await inject().post("/events").body(Fake.createEvent(2));
    expect(res.statusCode).toEqual(200);
    const id = res.json().id;
    expect(id).toBeDefined;

    const res2 = await inject().delete(`/events/${id}`);
    expect(res2.statusCode).toEqual(200);
    expect(res2.json().message).toEqual("Event is deleted");
  });

  it("should update event", async () => {
    const res = await inject()
      .patch("/events")
      .body({ id: 55, ...Fake.event(2) });
    expect(res.statusCode).toEqual(200);
    expect(res.json().id).toBeDefined;
  });

  /* it("should update user", async () => {
    const res = await inject()
      .patch("/users")
      .body({ id: 1, about: "Hello it's me!" });
    expect(res.statusCode).toEqual(200);
    expect(res.json().message).toEqual("User is updated");
  }); */

  /* it("should update user password", async () => {
    await new Promise((res) => {
      // wait to login correctly
      setTimeout(res, 2000);
    });
    const update = async (oldPassword: string, newPassword: string) => {
      const res = await inject()
        .patch("/users/updatePassword")
        .body({ id: 1, oldPassword, newPassword });
      expect(res.statusCode).toEqual(200);
      expect(res.json().message).toEqual("Password is updated");
    };
    await update("NA$At00r", "NA$At00r1");
    await update("NA$At00r1", "NA$At00r");
  }); */

  afterAll(app.close);
});
