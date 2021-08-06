import { Fake } from "../../utils/fake";
import { build } from "../../app";

const app = build();

type ResHeaders = { "set-cookie"?: string };

const expectCookie = ({ "set-cookie": cookie }: ResHeaders) => {
  expect(cookie).toMatch("sessionId=");
  return cookie;
};

describe("auth", () => {
  beforeAll(app.ready);

  it("should login and restore session", async () => {
    const res = await app
      .inject()
      .post("/auth/login")
      .payload({ email: "pantus@oleg.com", password: "NA$At00r" });
    expect(res.statusCode).toEqual(200);
    expect(typeof res.json().id === "number").toBeTruthy();
    const cookie = expectCookie(res.headers);

    const res2 = await app
      .inject()
      .get("/auth/restoreSession")
      .headers({ cookie });
    expect(res2.statusCode).toEqual(200);
    expect(res2.json().message).toEqual("Session is restored");
    expectCookie(res2.headers);
  });

  it("should register and delete account", async () => {
    const password = "password";

    const res = await app
      .inject()
      .post("/auth/register")
      .payload(Fake.user(password));
    expect(res.statusCode).toEqual(200);
    const userId = res.json().id;
    expect(typeof userId === "number").toBeTruthy();
    const cookie = expectCookie(res.headers);

    const res2 = await app
      .inject()
      .delete(`/users`)
      .query({ id: userId, password })
      .headers({ cookie });
    expect(res2.statusCode).toEqual(200);
    expect(res2.json().message).toEqual("User is deleted");
  });

  afterAll(app.close);
});
