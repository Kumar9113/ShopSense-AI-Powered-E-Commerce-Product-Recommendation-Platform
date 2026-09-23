import {
  navOptions,
  adminNavOptions,
  registrationFormControls,
  loginFormControls,
  adminAddProductformControls,
  addNewAddressFormControls,
  AvailableSizes,
} from "@/utils/index";

describe("navOptions", () => {
  it("contains an entry for every top-level shopping route", () => {
    const ids = navOptions.map((option) => option.id);
    expect(ids).toEqual([
      "home",
      "listing",
      "listingMen",
      "listingWomen",
      "listingKids",
    ]);
  });

  it("gives every option a non-empty label and a path starting with /", () => {
    navOptions.forEach((option) => {
      expect(option.label.length).toBeGreaterThan(0);
      expect(option.path.startsWith("/")).toBe(true);
    });
  });
});

describe("adminNavOptions", () => {
  it("links to the product management screens", () => {
    expect(adminNavOptions).toEqual([
      expect.objectContaining({ id: "adminListing", path: "/admin-view/all-products" }),
      expect.objectContaining({ id: "adminNewProduct", path: "/admin-view/add-product" }),
    ]);
  });
});

describe("registrationFormControls", () => {
  it("includes name, email, password and role fields", () => {
    const ids = registrationFormControls.map((control) => control.id);
    expect(ids).toEqual(["name", "email", "password", "role"]);
  });

  it("marks the password field as a password input", () => {
    const password = registrationFormControls.find((c) => c.id === "password");
    expect(password.type).toBe("password");
    expect(password.componentType).toBe("input");
  });

  it("gives the role field admin and customer options", () => {
    const role = registrationFormControls.find((c) => c.id === "role");
    expect(role.componentType).toBe("select");
    expect(role.options.map((o) => o.id)).toEqual(["admin", "customer"]);
  });
});

describe("loginFormControls", () => {
  it("only asks for email and password", () => {
    expect(loginFormControls.map((c) => c.id)).toEqual(["email", "password"]);
  });
});

describe("adminAddProductformControls", () => {
  it("has category and onSale as select controls with the expected options", () => {
    const category = adminAddProductformControls.find((c) => c.id === "category");
    expect(category.componentType).toBe("select");
    expect(category.options.map((o) => o.id)).toEqual(["men", "women", "kids"]);

    const onSale = adminAddProductformControls.find((c) => c.id === "onSale");
    expect(onSale.options.map((o) => o.id)).toEqual(["yes", "no"]);
  });

  it("uses a numeric input type for price and priceDrop", () => {
    const price = adminAddProductformControls.find((c) => c.id === "price");
    const priceDrop = adminAddProductformControls.find((c) => c.id === "priceDrop");
    expect(price.type).toBe("number");
    expect(priceDrop.type).toBe("number");
  });
});

describe("addNewAddressFormControls", () => {
  it("collects all the fields required by the Address model", () => {
    expect(addNewAddressFormControls.map((c) => c.id)).toEqual([
      "fullName",
      "address",
      "city",
      "country",
      "postalCode",
    ]);
  });
});

describe("AvailableSizes", () => {
  it("offers S, M and L", () => {
    expect(AvailableSizes.map((s) => s.id)).toEqual(["s", "m", "l"]);
  });
});
