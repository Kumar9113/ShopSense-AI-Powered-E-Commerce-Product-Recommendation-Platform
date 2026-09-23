/**
 * @jest-environment node
 */
import { POST } from "@/app/api/login/route";

jest.mock("@/app/database", () => jest.fn().mockResolvedValue(undefined));
jest.mock("@/models/user", () => ({
  findOne: jest.fn(),
}));
jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("signed-jwt-token"),
}));

import User from "@/models/user";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";

function makeRequest(body) {
  return { json: async () => body };
}

describe("POST /api/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SECRET_KEY = "test-secret";
  });

  it("rejects a request missing required fields", async () => {
    const req = makeRequest({ email: "jane@example.com" });
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it("reports when no account exists for the given email", async () => {
    User.findOne.mockResolvedValue(null);

    const req = makeRequest({ email: "ghost@example.com", password: "secret1" });
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body.message).toMatch(/account not found/i);
  });

  it("rejects an incorrect password without leaking a token", async () => {
    User.findOne.mockResolvedValue({ _id: "1", email: "jane@example.com", password: "hashed" });
    compare.mockResolvedValue(false);

    const req = makeRequest({ email: "jane@example.com", password: "wrong-password" });
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body.message).toMatch(/incorrect password/i);
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it("issues a signed JWT and user info on successful login", async () => {
    const user = {
      _id: "1",
      email: "jane@example.com",
      name: "Jane",
      role: "customer",
      password: "hashed",
    };
    User.findOne.mockResolvedValue(user);
    compare.mockResolvedValue(true);

    const req = makeRequest({ email: "jane@example.com", password: "secret1" });
    const res = await POST(req);
    const body = await res.json();

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: user._id, email: user.email, role: user.role },
      "test-secret",
      { expiresIn: "1d" }
    );
    expect(body.success).toBe(true);
    expect(body.finalData.token).toBe("signed-jwt-token");
    expect(body.finalData.user).toEqual({
      email: "jane@example.com",
      name: "Jane",
      _id: "1",
      role: "customer",
    });
    // the password hash should never be sent back to the client
    expect(body.finalData.user.password).toBeUndefined();
  });

  it("returns a generic failure message if the database throws", async () => {
    User.findOne.mockRejectedValue(new Error("connection lost"));

    const req = makeRequest({ email: "jane@example.com", password: "secret1" });
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body.message).toMatch(/something went wrong/i);
  });
});
