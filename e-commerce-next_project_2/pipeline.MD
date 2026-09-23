# Pipeline & Architecture — E-Commerce Next

This document traces how data actually moves through the app, end to end, based on the code in `src/`.

## 1. High-Level Architecture

```
┌──────────────────────────── Browser ────────────────────────────┐
│  React Client Components (app/**/page.js)                        │
│    ↳ GlobalContext (context/index.js) — auth flag, user, cart,   │
│      addresses, checkout form, orders, loaders                   │
│    ↳ js-cookie (JWT token)  +  localStorage (user, cartItems)    │
└───────────────┬───────────────────────────────┬──────────────────┘
                │ fetch() via services/*                            
                ▼                                                    
┌──────────────────────────── Next.js Server ───────────────────────┐
│  Route Handlers  src/app/api/**/route.js                          │
│    1. connectToDB()        → src/app/database/index.js (Mongoose) │
│    2. AuthUser(req)        → src/middleware/AuthUser.js (JWT)     │
│    3. Joi schema.validate()                                       │
│    4. Mongoose model op    → src/models/*.js                      │
│    5. NextResponse.json({ success, message, data })                │
└───────────────┬─────────────────────────────────┬──────────────────┘
                ▼                                   ▼
        ┌───────────────┐                 ┌──────────────────┐
        │  MongoDB Atlas │                 │   Stripe API      │
        │  (users, products, carts,        │   Checkout Session │
        │   addresses, orders)             └──────────────────┘
        └───────────────┘
```

Every domain (auth, product, cart, address, order, stripe) follows the same layered pattern:

**Page component → `services/<domain>/index.js` (fetch wrapper) → `app/api/<domain>/.../route.js` (handler) → `middleware/AuthUser.js` + `models/<domain>.js` → MongoDB**

## 2. Request Pipeline (every protected route)

```
Client                Route Handler                         Mongo/Stripe
  │  fetch + Bearer token   │
  ├────────────────────────►│
  │                         │ 1. connectToDB()
  │                         │ 2. AuthUser(req) → jwt.verify(token, SECRET_KEY)
  │                         │      └─ false → { success:false, "not authenticated" }
  │                         │ 3. Joi validate(body)
  │                         │      └─ error → { success:false, message }
  │                         │ 4. Mongoose op (find/create/update/delete)
  │                         │ 5. NextResponse.json({ success, message, data? })
  │◄────────────────────────┤
```

`AuthUser.js` reads `Authorization: Bearer <token>`, verifies it with `jsonwebtoken`, and returns the decoded payload (`{ id, email, role }`) or `false`. Admin-only routes additionally check `isAuthUser?.role === "admin"`.

## 3. Feature Pipelines

### 3.1 Registration & Login

```
/register page → services/register → POST /api/register
   Joi validate → check existing user by email → bcrypt hash password
   → User.create() → { success, message }

/login page → services/login → POST /api/login
   Joi validate → User.findOne({email}) → bcrypt.compare(password)
   → jwt.sign({id, email, role}, SECRET_KEY, 1d expiry)
   → { token, user } → client stores token in cookie, user in localStorage
   → GlobalContext.isAuthUser = true
```

### 3.2 Product Browsing

```
/product/listing/{all-products|men|women|kids} page
   → services/product.getAllProducts() / getProductsByCategory()
   → GET /api/admin/all-products  |  GET /api/admin/product-by-category
   → Product.find({ category? }) → list rendered via CommonListing components

/product/[details] page
   → services/product.getProductById()
   → GET /api/admin/product-by-id
   → Product.findById() → CommonDetails component
```

### 3.3 Cart

```
"Add to cart" button → services/cart.addToCart()
   → POST /api/cart/add-to-cart
   → AuthUser check → Joi validate {userID, productID}
   → Cart.find(existing?) → duplicate guard
   → Cart.create({userID, productID, quantity})
   → client refetches cart, mirrors into GlobalContext.cartItems + localStorage
   (CartModal renders the mirrored state for instant feedback)

"Remove from cart" → services/cart.deleteCartItem() → POST /api/cart/delete-from-cart
   → Cart.deleteOne/deleteMany → refresh context state
```

### 3.4 Address Book

```
/account page → services/address (get/add/update/delete)
   → /api/address/* route handlers
   → Address model, keyed by userID
   → GlobalContext.addresses feeds the address selector on /checkout
```

### 3.5 Checkout & Payment (Stripe)

```
/checkout page
   1. Load addresses for user (services/address.fetchAllAddresses)
   2. User selects address, reviews cartItems + totalPrice
   3. services/stripe.callStripeSession(lineItems)
        → POST /api/stripe (Bearer token required)
        → AuthUser check
        → stripe.checkout.sessions.create({
             line_items, mode:"payment",
             success_url: `${SERVER}/checkout?status=success`,
             cancel_url:  `${SERVER}/checkout?status=cancel`
          })
        → { success:true, id: session.id }
   4. Client redirects to Stripe-hosted Checkout page using the session id
   5. Stripe redirects back to /checkout?status=success|cancel

   On return with status=success:
   6. Client reads cartItems + checkoutFormData back out of localStorage
   7. Builds order payload (user, orderItems[], shippingAddress, totalPrice,
      isPaid:true, isProcessing:true, paidAt)
   8. services/order.createNewOrder() → POST /api/order/create-order
        → AuthUser check → Order.create(payload)
        → Cart.deleteMany({ userID }) — cart is cleared
        → { success:true, "Products are on the way !" }
```

> Note: payment confirmation is **self-reported by the client** (based on the `status=success` query param), not verified server-side against Stripe. See README "Known Issues" for the recommended webhook-based fix.

### 3.6 Order History

```
/orders page → services/order.getAllOrdersForUser() → GET /api/order/get-all-orders
   → Order.find({ user }) → list rendered, click-through to
/orders/[order-details] → services/order.getOrderDetails() → GET /api/order/order-details
   → Order.findById().populate('orderItems.product')
```

### 3.7 Admin Panel

```
/admin-view/add-product → services/product.addNewProduct() → POST /api/admin/add-product
   → AuthUser check role==="admin" → Joi validate → Product.create()

/admin-view/all-products → list + edit/delete
   → update: POST /api/admin/update-product → Product.findByIdAndUpdate()
   → delete: POST /api/admin/delete-product → Product.findByIdAndDelete()

Admin orders → GET /api/admin/orders/get-all-orders (Order.find({}))
             → POST /api/admin/orders/update-order (update isProcessing/isPaid status)
```

## 4. Client-Side State Pipeline

`GlobalContext` (`src/context/index.js`) is the single source of truth on the client:

```
App mount (layout.js wraps <GlobalState>)
   → useEffect checks Cookies.get("token")
        found  → isAuthUser=true, hydrate user + cartItems from localStorage
        absent → isAuthUser=false, user={}
   → context exposes: auth state, cart, addresses, checkoutFormData,
     order lists/details, and UI flags (modals, loaders)
   → every page/component consumes via useContext(GlobalContext)
```

Each service call in `services/*` is a thin `fetch()` wrapper that attaches the JWT (`Authorization: Bearer <token>` from `js-cookie`) and returns parsed JSON; pages call these services, then push results into `GlobalContext` state — there is no server-side session or SSR data-fetching for authenticated data, everything authenticated is client-fetched after hydration.

## 5. Security & Validation Layers Present

| Layer | Where |
|---|---|
| Password hashing | `bcryptjs` on register (`hash`) and login (`compare`) |
| Auth token | JWT signed with `SECRET_KEY`, 1-day expiry, verified per-request in `AuthUser.js` |
| Input validation | `Joi` schemas in nearly every route handler |
| Authorization (role) | Admin routes check `role === "admin"` after JWT verification |
| Duplicate guards | Cart add checks for existing `{userID, productID}` before insert |

## 6. Gaps Identified While Tracing the Pipeline

1. Hard-coded MongoDB URI in `app/database/index.js` bypasses `DATABASE_URL` env var.
2. Hard-coded Stripe publishable key in `app/checkout/page.js`.
3. No Stripe webhook — order "paid" status is trusted from the client redirect, not verified server-side.
4. `register/route.js` contains a large commented-out duplicate of itself — dead code to clean up.
5. Several `console.log` debug statements left in production route handlers (e.g. `add-to-cart`, `add-product`).