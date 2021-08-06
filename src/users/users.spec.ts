import { build } from "../../app";

const app = build();

const inject = () => {
  const cookie = app.config.cookie;
  return app.inject().headers({ cookie });
};

describe("users", () => {
  beforeAll(app.ready);

  it("should get user", async () => {
    const res = await inject().get("/users/1");
    expect(res.statusCode).toEqual(200);
    expect(res.json().id).toBeDefined();
  });

  it("should search users", async () => {
    const res = await inject()
      .get("/users/search")
      .query({ query: "olezha", offset: 0, limit: 10 });
    expect(res.statusCode).toEqual(200);
    expect(res.json()[0].id).toBeDefined();
  });

  it("should search users by sport", async () => {
    const res = await inject()
      .get("/users/searchBySports")
      .query({ sports: ["running", "volleyball"], offset: 0, limit: 10 });
    expect(res.statusCode).toEqual(200);
    expect(res.json()[0].id).toBeDefined();
  });

  it("should search popular users", async () => {
    const res = await inject()
      .get("/users/popular")
      .query({ offset: 0, limit: 10 });
    expect(res.statusCode).toEqual(200);
    const users = res.json();
    const moreFollowed = users[0].followersCount;
    const lessFollowed = users[users.length - 1].followersCount;
    expect(moreFollowed >= lessFollowed).toBeTruthy();
  });

  it("should update user", async () => {
    const res = await inject()
      .patch("/users")
      .body({ id: 1, about: "Hello it's me!" });
    expect(res.statusCode).toEqual(200);
    expect(res.json().message).toEqual("User is updated");
  });

  it("should update user password", async () => {
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
  });

  afterAll(app.close);
});
