/**
 * @jest-environment node
 */
import { POST } from "@/app/api/register/route";

jest.mock("@/app/database", () => jest.fn().mockResolvedValue(undefined));
jest.mock("@/models/user", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
}));

import connectToDB from "@/app/database";
import User from "@/models/user";
import { hash } from "bcryptjs";

function makeRequest(body) {
  return { json: async () => body };
}

describe("POST /api/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects an invalid payload before touching the database", async () => {
    const req = makeRequest({
      name: "Jane",
      email: "not-an-email",
      password: "secret1",
      role: "customer",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body.message).toMatch(/email/i);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it("rejects a password shorter than 6 characters", async () => {
    const req = makeRequest({
      name: "Jane",
      email: "jane@example.com",
      password: "abc",
      role: "customer",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body.message).toMatch(/password/i);
  });

  it("refuses to create a duplicate account for an existing email", async () => {
    User.findOne.mockResolvedValue({ _id: "existing-id", email: "jane@example.com" });

    const req = makeRequest({
      name: "Jane",
      email: "jane@example.com",
      password: "secret1",
      role: "customer",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(connectToDB).toHaveBeenCalled();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/already exists/i);
    expect(User.create).not.toHaveBeenCalled();
  });

  it("hashes the password and creates a new user on success", async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ _id: "new-id" });

    const req = makeRequest({
      name: "Jane",
      email: "jane@example.com",
      password: "secret1",
      role: "customer",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(hash).toHaveBeenCalledWith("secret1", 12);
    expect(User.create).toHaveBeenCalledWith({
      name: "Jane",
      email: "jane@example.com",
      password: "hashed-password",
      role: "customer",
    });
    expect(body).toEqual({
      success: true,
      message: "Account created successfully.",
    });
  });

  it("returns a generic failure message if the database throws", async () => {
    User.findOne.mockRejectedValue(new Error("connection lost"));

    const req = makeRequest({
      name: "Jane",
      email: "jane@example.com",
      password: "secret1",
      role: "customer",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body.message).toMatch(/something went wrong/i);
  });
});
