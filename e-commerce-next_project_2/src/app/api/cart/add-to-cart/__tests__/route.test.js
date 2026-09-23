/**
 * @jest-environment node
 */
import { POST } from "@/app/api/cart/add-to-cart/route";

jest.mock("@/app/database", () => jest.fn().mockResolvedValue(undefined));
jest.mock("@/middleware/AuthUser", () => jest.fn());
jest.mock("@/models/cart", () => ({
  find: jest.fn(),
  create: jest.fn(),
}));

import AuthUser from "@/middleware/AuthUser";
import Cart from "@/models/cart";

function makeRequest(body, headers = { Authorization: "Bearer valid-token" }) {
  return {
    headers: { get: (name) => headers[name] ?? null },
    json: async () => body,
  };
}

describe("POST /api/cart/add-to-cart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks unauthenticated requests", async () => {
    AuthUser.mockResolvedValue(false);

    const req = makeRequest({ userID: "u1", productID: "p1" }, {});
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body.message).toMatch(/not authenticated/i);
    expect(Cart.create).not.toHaveBeenCalled();
  });

  it("validates the payload for an authenticated user", async () => {
    AuthUser.mockResolvedValue({ id: "u1" });

    const req = makeRequest({ userID: "", productID: "p1" });
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(Cart.create).not.toHaveBeenCalled();
  });

  it("refuses to add a product already in the cart", async () => {
    AuthUser.mockResolvedValue({ id: "u1" });
    Cart.find.mockResolvedValue([{ _id: "existing" }]);

    const req = makeRequest({ userID: "u1", productID: "p1" });
    const res = await POST(req);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body.message).toMatch(/already added/i);
    expect(Cart.create).not.toHaveBeenCalled();
  });

  it("adds a new product to the cart", async () => {
    AuthUser.mockResolvedValue({ id: "u1" });
    Cart.find.mockResolvedValue([]);
    Cart.create.mockResolvedValue({ _id: "new-cart-item" });

    const req = makeRequest({ userID: "u1", productID: "p1" });
    const res = await POST(req);
    const body = await res.json();

    expect(Cart.create).toHaveBeenCalledWith({ userID: "u1", productID: "p1" });
    expect(body).toEqual({ success: true, message: "Product is added to cart !" });
  });
});
