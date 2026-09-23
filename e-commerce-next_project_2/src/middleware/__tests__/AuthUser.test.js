import jwt from "jsonwebtoken";
import AuthUser from "@/middleware/AuthUser";

// Helper that mimics the subset of the Next.js Request API the middleware relies on.
function makeRequest(authorizationHeader) {
  return {
    headers: {
      get: (name) => {
        if (name === "Authorization") return authorizationHeader;
        return null;
      },
    },
  };
}

describe("AuthUser middleware", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, SECRET_KEY: "test-secret" };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("returns false when no Authorization header is present", async () => {
    const req = makeRequest(undefined);
    await expect(AuthUser(req)).resolves.toBe(false);
  });

  it("returns the decoded payload for a valid bearer token", async () => {
    const payload = { id: "user-1", email: "jane@example.com", role: "customer" };
    const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1h" });
    const req = makeRequest(`Bearer ${token}`);

    const result = await AuthUser(req);

    expect(result).toMatchObject(payload);
  });

  it("returns false for a malformed token", async () => {
    const req = makeRequest("Bearer not-a-real-token");
    await expect(AuthUser(req)).resolves.toBe(false);
  });

  it("returns false for a token signed with the wrong secret", async () => {
    const token = jwt.sign({ id: "user-1" }, "some-other-secret", { expiresIn: "1h" });
    const req = makeRequest(`Bearer ${token}`);

    await expect(AuthUser(req)).resolves.toBe(false);
  });

  it("returns false for an expired token", async () => {
    const token = jwt.sign({ id: "user-1" }, process.env.SECRET_KEY, { expiresIn: -10 });
    const req = makeRequest(`Bearer ${token}`);

    await expect(AuthUser(req)).resolves.toBe(false);
  });
});
