# Pipeline & Architecture — ShopSense

This document traces how data moves through the ShopSense application end to end, covering the Next.js e-commerce application and the separate FastAPI AI/ML service.

---

## 1. High-Level Architecture

```text
┌────────────────────────────── Browser ──────────────────────────────┐
│  React / Next.js Client Components                                  │
│                                                                     │
│  ↳ GlobalContext                                                    │
│     auth state, user, cart, addresses, checkout, orders, UI state   │
│                                                                     │
│  ↳ js-cookie                                                        │
│     JWT authentication token                                        │
│                                                                     │
│  ↳ localStorage                                                     │
│     user / cart state                                                │
└───────────────────────┬──────────────────────┬──────────────────────┘
                        │                      │
                 fetch() / services/*         │
                        │                      │
                        ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Next.js Application                            │
│                                                                     │
│  Next.js 13 App Router                                              │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Route Handlers: src/app/api/**/route.js                       │  │
│  │                                                               │  │
│  │  1. Authentication → AuthUser / JWT                          │  │
│  │  2. Validation     → Joi                                     │  │
│  │  3. Database       → Mongoose                                │  │
│  │  4. Business logic → Route handlers                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└───────────────┬─────────────────┬──────────────────┬────────────────┘
                │                 │                  │
                ▼                 ▼                  ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
        │   MongoDB    │  │   Supabase   │  │      Stripe      │
        │              │  │   Storage    │  │     Checkout     │
        │ Users        │  │              │  │                  │
        │ Products     │  │ Product      │  │ Payment Session  │
        │ Cart         │  │ Images       │  │                  │
        │ Addresses    │  │              │  │                  │
        │ Orders       │  │              │  │                  │
        └──────────────┘  └──────────────┘  └──────────────────┘
                │
                │ AI catalog
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       FastAPI AI Service                             │
│                                                                     │
│  Sentence Transformers     FAISS        DistilBERT                  │
│  all-MiniLM-L6-v2          Search       Sentiment                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

At a high level, ShopSense contains:

* A Next.js 13 customer and admin application.
* Next.js Route Handlers for application APIs.
* MongoDB/Mongoose for application data.
* Supabase Storage for product images.
* Stripe Checkout for payments.
* A separate Python/FastAPI service for AI functionality.
* Sentence Transformers and FAISS for semantic search and recommendations.
* DistilBERT for review sentiment analysis.

The main application follows this pattern:

```text
Page / Component
      │
      ▼
services/<domain>/*
      │
      ▼
/api/<domain>/*
      │
      ▼
Authentication + Validation
      │
      ▼
Mongoose Model
      │
      ▼
MongoDB
```

AI requests use a separate path:

```text
ShopSense UI
      │
      ▼
Next.js /api/ai/*
      │
      ▼
FastAPI AI Service
      │
      ├── Sentence Transformers
      ├── FAISS
      └── DistilBERT
```

---

# 2. Request Pipeline

## 2.1 Standard Application Request

```text
Client
  │
  │ fetch()
  │ Authorization: Bearer <JWT>
  ▼
Next.js Route Handler
  │
  ├── 1. connectToDB()
  │
  ├── 2. AuthUser(req)
  │       │
  │       └── jwt.verify(token, SECRET_KEY)
  │
  ├── 3. Joi validation
  │
  ├── 4. Mongoose operation
  │
  └── 5. NextResponse.json()
  │
  ▼
Client
```

The authentication middleware reads the JWT from the request and verifies it.

The decoded authentication payload contains information such as:

```text
{
    id,
    email,
    role
}
```

If authentication fails, the route returns an authentication error.

Admin-only operations additionally verify:

```text
role === "admin"
```

---

# 3. Feature Pipelines

## 3.1 Registration

```text
/register
     │
     ▼
services/register
     │
     ▼
POST /api/register
     │
     ├── Joi validation
     │
     ├── Check existing email
     │
     ├── bcrypt password hashing
     │
     ▼
User.create()
     │
     ▼
MongoDB
     │
     ▼
Success response
```

The password is hashed before it is stored in MongoDB.

---

## 3.2 Login

```text
/login
   │
   ▼
services/login
   │
   ▼
POST /api/login
   │
   ├── Joi validation
   │
   ├── User.findOne({ email })
   │
   ├── bcrypt.compare()
   │
   ├── jwt.sign({
   │      id,
   │      email,
   │      role
   │   })
   │
   ▼
{ token, user }
   │
   ├──────────────► JWT stored in cookie
   │
   └──────────────► user stored in localStorage
                         │
                         ▼
                  GlobalContext
                         │
                         ▼
                  isAuthUser = true
```

The JWT is subsequently attached to protected API requests.

---

# 4. Product Browsing Pipeline

## 4.1 Product Listing

```text
/product/listing/all-products
/product/listing/men
/product/listing/women
/product/listing/kids
             │
             ▼
services/product
             │
             ▼
GET /api/admin/all-products
        OR
GET /api/admin/product-by-category
             │
             ▼
Product Model
             │
             ▼
MongoDB
             │
             ▼
Product List
             │
             ▼
CommonListing Components
             │
             ▼
ShopSense UI
```

---

## 4.2 Product Details

```text
/product/[details]
       │
       ▼
services/product.getProductById()
       │
       ▼
GET /api/admin/product-by-id
       │
       ▼
Product.findById()
       │
       ▼
MongoDB
       │
       ▼
Product Details
       │
       ▼
CommonDetails Component
```

---

# 5. Cart Pipeline

## 5.1 Add Product to Cart

```text
"Add to Cart"
      │
      ▼
services/cart.addToCart()
      │
      ▼
POST /api/cart/add-to-cart
      │
      ├── AuthUser
      │
      ├── Joi validation
      │
      ├── Check existing cart item
      │
      └── Cart.create()
             │
             ▼
          MongoDB
             │
             ▼
       Cart response
             │
             ▼
      Fetch cart again
             │
             ▼
       GlobalContext
             │
             ▼
        cartItems
             │
             ▼
         CartModal
```

The client mirrors the cart state into `GlobalContext` and local storage.

---

## 5.2 Remove Product From Cart

```text
Remove from Cart
      │
      ▼
services/cart.deleteCartItem()
      │
      ▼
POST /api/cart/delete-from-cart
      │
      ▼
Cart delete operation
      │
      ▼
MongoDB
      │
      ▼
Refresh cart
      │
      ▼
GlobalContext.cartItems
```

---

# 6. Address Pipeline

```text
Account / Checkout
       │
       ▼
services/address/*
       │
       ▼
/api/address/*
       │
       ├── Authentication
       │
       ├── Validation
       │
       ▼
Address Model
       │
       ▼
MongoDB
       │
       ▼
Address List
       │
       ▼
GlobalContext.addresses
       │
       ▼
Checkout Address Selector
```

Address operations include:

* Add address
* Update address
* Delete address
* Retrieve addresses

---

# 7. Checkout & Stripe Pipeline

```text
                         Checkout Page
                              │
                              ▼
                    Load User Addresses
                              │
                              ▼
                     Select Shipping Address
                              │
                              ▼
                    Review Cart + Total Price
                              │
                              ▼
                    services/stripe/*
                              │
                              ▼
                       POST /api/stripe
                              │
                              ▼
                         AuthUser
                              │
                              ▼
                  stripe.checkout.sessions.create()
                              │
                              ▼
                     Stripe Checkout Page
                              │
                              ▼
                     Customer completes payment
                              │
                              ▼
                  Redirect to /checkout?status=success
                              │
                              ▼
                    Client reads checkout state
                              │
                              ▼
                     Build order payload
                              │
                              ▼
                  POST /api/order/create-order
                              │
                              ▼
                         AuthUser
                              │
                              ▼
                        Order.create()
                              │
                              ├───────────────┐
                              ▼               ▼
                           MongoDB       Cart.deleteMany()
```

The order payload contains information such as:

```text
user
orderItems
shippingAddress
totalPrice
isPaid
isProcessing
paidAt
```

### Payment Verification Limitation

The current checkout flow uses the client-side success redirect to continue order creation.

A production-grade implementation should verify payment server-side using Stripe webhooks rather than relying only on the client redirect.

---

# 8. Order History Pipeline

## 8.1 User Orders

```text
/orders
   │
   ▼
services/order.getAllOrdersForUser()
   │
   ▼
GET /api/order/get-all-orders
   │
   ▼
Order.find({ user })
   │
   ▼
MongoDB
   │
   ▼
Orders
   │
   ▼
Orders UI
```

## 8.2 Order Details

```text
/orders/[order-details]
          │
          ▼
services/order.getOrderDetails()
          │
          ▼
GET /api/order/order-details
          │
          ▼
Order.findById()
.populate("orderItems.product")
          │
          ▼
MongoDB
          │
          ▼
Order Details UI
```

---

# 9. Admin Pipeline

## 9.1 Add Product

```text
/admin-view/add-product
          │
          ▼
services/product.addNewProduct()
          │
          ▼
POST /api/admin/add-product
          │
          ├── AuthUser
          │
          ├── role === "admin"
          │
          ├── Joi validation
          │
          ▼
Product.create()
          │
          ▼
MongoDB
```

Product images are handled through Supabase Storage, while product metadata is stored in MongoDB.

---

## 9.2 Update Product

```text
/admin-view/all-products
          │
          ▼
Edit Product
          │
          ▼
POST /api/admin/update-product
          │
          ▼
AuthUser
          │
          ▼
Admin role check
          │
          ▼
Product.findByIdAndUpdate()
          │
          ▼
MongoDB
```

---

## 9.3 Delete Product

```text
/admin-view/all-products
          │
          ▼
Delete Product
          │
          ▼
POST /api/admin/delete-product
          │
          ▼
AuthUser
          │
          ▼
Admin role check
          │
          ▼
Product.findByIdAndDelete()
          │
          ▼
MongoDB
```

---

## 9.4 Admin Orders

```text
Admin Orders
      │
      ▼
GET /api/admin/orders/get-all-orders
      │
      ▼
Order.find({})
      │
      ▼
MongoDB
      │
      ▼
All Customer Orders
```

Order status updates use:

```text
POST /api/admin/orders/update-order
      │
      ▼
Update order status
      │
      ▼
MongoDB
```

---

# 10. AI / ML Pipeline

ShopSense uses a separate FastAPI service for AI functionality.

The AI service exposes:

```text
GET  /health
POST /catalog/index
POST /search
POST /recommend
POST /sentiment
```

The Next.js application acts as the application-facing layer and forwards AI requests to the FastAPI service.

---

## 10.1 AI Service Architecture

```text
                    ShopSense Next.js
                           │
                           │ AI_SERVICE_URL
                           ▼
                 ┌─────────────────────┐
                 │   FastAPI Service   │
                 └──────────┬──────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
       Sentence          FAISS        DistilBERT
       Transformers      Vector       Sentiment
                         Search
```

---

# 11. AI Catalog Indexing Pipeline

The catalog indexing pipeline converts MongoDB products into searchable vector representations.

```text
MongoDB Product Catalog
          │
          ▼
POST /api/ai/catalog
          │
          ▼
Next.js AI Route
          │
          ▼
POST /catalog/index
          │
          ▼
FastAPI
          │
          ▼
Build Product Text
          │
          ├── name
          ├── description
          ├── category
          └── deliveryInfo
          │
          ▼
Sentence Transformer
all-MiniLM-L6-v2
          │
          ▼
Product Embeddings
          │
          ▼
Normalize Embeddings
          │
          ▼
FAISS IndexFlatIP
          │
          ├──────────────► products.faiss
          │
          └──────────────► catalog.json
```

The persisted files are:

```text
data/vector_index/
├── products.faiss
└── catalog.json
```

---

# 12. Semantic Search Pipeline

```text
User Search Query
        │
        ▼
POST /api/ai/search
        │
        ▼
Next.js AI Route
        │
        ▼
POST /search
        │
        ▼
FastAPI
        │
        ▼
Sentence Transformer
all-MiniLM-L6-v2
        │
        ▼
Query Embedding
        │
        ▼
Normalized Query Vector
        │
        ▼
FAISS IndexFlatIP
        │
        ▼
Similarity Search
        │
        ▼
Top-K Products
        │
        ▼
Next.js
        │
        ▼
ShopSense UI
```

The search endpoint accepts:

```text
query
top_k
```

The current implementation allows:

```text
1 <= top_k <= 50
```

---

# 13. Product Recommendation Pipeline

Recommendations can be generated from either:

* A product ID
* A natural-language query

```text
Product ID / Natural-Language Query
                │
                ▼
        POST /api/ai/recommend
                │
                ▼
           Next.js Route
                │
                ▼
          POST /recommend
                │
                ▼
            FastAPI
                │
                ▼
        Query/Product Text
                │
                ▼
      Sentence Transformer
        all-MiniLM-L6-v2
                │
                ▼
          Query Embedding
                │
                ▼
          FAISS Search
                │
                ▼
        Similar Products
                │
                ▼
       Source Product Removed
       when product_id is used
                │
                ▼
          Top-K Results
                │
                ▼
           ShopSense UI
```

The recommendation endpoint supports:

```text
product_id   optional
query        optional
top_k        default: 6
```

When a `product_id` is provided, the source product itself is excluded from the returned recommendation list.

---

# 14. Review Sentiment Pipeline

ShopSense uses a DistilBERT-based sentiment model for review analysis.

```text
Customer Review
       │
       ▼
POST /api/ai/sentiment
       │
       ▼
Next.js AI Route
       │
       ▼
POST /sentiment
       │
       ▼
FastAPI
       │
       ▼
DistilBERT
amazon-sentiment-distilbert
       │
       ▼
Sentiment Prediction
       │
       ├──────────────► Positive
       │
       └──────────────► Negative
       │
       ▼
Confidence Score
       │
       ▼
Next.js
       │
       ▼
ShopSense UI
```

The sentiment request accepts:

```text
text
```

The implementation limits the input to:

```text
2–5000 characters
```

---

# 15. Complete AI Pipeline

```text
                         ┌───────────────────────┐
                         │      ShopSense UI     │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │    Next.js AI APIs    │
                         │                       │
                         │ /api/ai/catalog       │
                         │ /api/ai/search        │
                         │ /api/ai/recommend     │
                         │ /api/ai/sentiment     │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │    FastAPI Service    │
                         └───────────┬───────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
       │  Sentence   │       │    FAISS    │       │  DistilBERT │
       │ Transformers│       │ IndexFlatIP │       │  Sentiment  │
       └──────┬──────┘       └──────┬──────┘       └──────┬──────┘
              │                     │                      │
              ▼                     ▼                      ▼
       Product / Query       Semantic Search        Review Analysis
        Embeddings            Recommendations       Positive/Negative
```

---

# 16. Client-Side State Pipeline

`GlobalContext` acts as the central client-side state container.

```text
App Mount
    │
    ▼
layout.js
    │
    ▼
<GlobalState>
    │
    ▼
Check Cookies.get("token")
    │
    ├── Token exists
    │       │
    │       ├── isAuthUser = true
    │       ├── Load user
    │       └── Load cartItems
    │
    └── Token absent
            │
            ├── isAuthUser = false
            └── user = {}
```

The context manages application state including:

```text
Authentication
User
Cart
Addresses
Checkout form
Orders
Order details
Loading states
Modal states
```

Components consume the state through:

```text
useContext(GlobalContext)
```

---

# 17. Service Layer Pipeline

The service layer keeps client-side API calls separate from UI components.

```text
React Component
      │
      ▼
services/<domain>/index.js
      │
      ▼
fetch()
      │
      ├── URL
      ├── HTTP method
      ├── request body
      └── Authorization header
      │
      ▼
Next.js Route Handler
      │
      ▼
JSON Response
      │
      ▼
Service
      │
      ▼
React Component
      │
      ▼
GlobalContext / Local UI State
```

Typical domains include:

```text
services/
├── login/
├── register/
├── product/
├── cart/
├── address/
├── order/
├── stripe/
└── storage/
```

---

# 18. Security & Validation Layers

| Layer                     | Implementation                         |
| ------------------------- | -------------------------------------- |
| Password hashing          | `bcryptjs`                             |
| Authentication            | JWT                                    |
| JWT verification          | `AuthUser.js`                          |
| Token expiry              | 1 day                                  |
| Request validation        | Joi                                    |
| Authorization             | JWT `role`                             |
| Admin protection          | `role === "admin"`                     |
| Database access           | Mongoose                               |
| Duplicate cart protection | Existing `{ userID, productID }` check |
| Payment provider          | Stripe Checkout                        |
| Product image storage     | Supabase Storage                       |

The standard protected-request sequence is:

```text
JWT
 │
 ▼
AuthUser
 │
 ▼
Joi Validation
 │
 ▼
Authorization
 │
 ▼
Mongoose Operation
 │
 ▼
MongoDB
```

---

# 19. Data Flow Summary

## Customer Flow

```text
Register
   │
   ▼
Login
   │
   ▼
JWT
   │
   ▼
Browse Products
   │
   ├──────────────► Semantic Search
   │
   └──────────────► Recommendations
   │
   ▼
Add to Cart
   │
   ▼
Select Address
   │
   ▼
Stripe Checkout
   │
   ▼
Create Order
   │
   ▼
Order History
```

## Admin Flow

```text
Admin Login
     │
     ▼
JWT + role=admin
     │
     ▼
Admin Panel
     │
     ├── Add Product
     ├── Update Product
     ├── Delete Product
     ├── View Products
     └── Manage Orders
```

## AI Flow

```text
MongoDB Catalog
      │
      ▼
Catalog Indexing
      │
      ▼
Sentence Embeddings
      │
      ▼
FAISS
      │
      ├── Semantic Search
      │
      └── Recommendations

Customer Review
      │
      ▼
DistilBERT
      │
      ▼
Sentiment + Confidence
```

---

# 20. Known Implementation Considerations

### 20.1 Payment Verification

The current checkout flow uses the client-side success redirect to continue order creation.

For a production payment workflow, Stripe webhook verification should be used to confirm the payment event server-side before marking an order as paid.

### 20.2 AI Index Refresh

The FAISS index is persisted separately from MongoDB.

When the product catalog changes, the AI catalog indexing endpoint should be triggered so that the vector index represents the current product catalog.

### 20.3 AI Evaluation

The project contains evaluation and training scripts for the AI components.

Performance metrics should only be reported after running the evaluation scripts against a defined test dataset. The architecture itself does not imply a particular retrieval or sentiment score.

---

# 21. End-to-End ShopSense Pipeline

```text
                         ┌──────────────────────┐
                         │        USER          │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Next.js + React    │
                         │       Frontend       │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
              E-Commerce           AI              Storage
                APIs              APIs              APIs
                  │                 │                 │
                  ▼                 ▼                 ▼
             Next.js API         FastAPI          Supabase
                  │                 │
                  ▼                 │
              MongoDB               │
                  │                 │
                  │       ┌─────────┴──────────┐
                  │       │                    │
                  │       ▼                    ▼
                  │   Sentence              DistilBERT
                  │   Transformers          Sentiment
                  │       │
                  │       ▼
                  │     FAISS
                  │       │
                  │       ├── Search
                  │       └── Recommendations
                  │
                  ▼
             Orders / Cart /
          Products / Users
                  │
                  ▼
             ShopSense UI
```
