# ShopSense --- AI-Powered E-Commerce & Product Recommendation Platform

ShopSense is a full-stack fashion e-commerce platform built with
**Next.js 13 (App Router)**, **MongoDB**, **Supabase**, and **Stripe**.
It provides a customer storefront and an admin dashboard for product and
order management, and adds a separate **Python/FastAPI AI service** for
semantic product search, product recommendations, and review sentiment
analysis.

<p align="center">
  <img src="./public/shopsense-workflow.png" alt="ShopSense End-to-End Workflow" width="100%">
</p>

The project is designed as a two-part application:

-   **Next.js application** --- storefront, admin panel, authentication,
    database access, payments, storage integration, and API routes.
-   **FastAPI AI service** --- Sentence Transformer embeddings + FAISS
    for semantic retrieval and a DistilBERT-based model for sentiment
    classification.

The application can be developed locally **without Docker**.

------------------------------------------------------------------------

## Table of Contents

-   [Features](#features)
-   [Technology Stack](#technology-stack)
-   [System Architecture](#system-architecture)
-   [AI/ML Architecture](#aiml-architecture)
-   [Application Architecture](#application-architecture)
-   [Project Structure](#project-structure)
-   [Authentication and
    Authorization](#authentication-and-authorization)
-   [AI Features](#ai-features)
-   [Data Models](#data-models)
-   [Environment Variables](#environment-variables)
-   [Getting Started](#getting-started)
-   [Running the AI Service](#running-the-ai-service)
-   [Running ShopSense](#running-shopsense)
-   [Using Semantic Search](#using-semantic-search)
-   [AI API Reference](#ai-api-reference)
-   [E-Commerce API Reference](#e-commerce-api-reference)
-   [AI Evaluation](#ai-evaluation)
-   [Testing](#testing)
-   [Production Build](#production-build)
-   [Known Limitations](#known-limitations)

------------------------------------------------------------------------

## Features

### Customer Features

-   User registration and login
-   JWT-based authentication
-   Browse products by:
    -   All products
    -   Men
    -   Women
    -   Kids
-   Product details
-   Shopping cart
-   Saved shipping addresses
-   Stripe Checkout
-   Order creation and order history
-   Individual order details
-   Semantic product search
-   AI-powered product recommendations
-   Review sentiment analysis

### Admin Features

-   Admin authentication and role-based access
-   Add products
-   Upload product images
-   Update products
-   Delete products
-   View all products
-   View all customer orders
-   Update order processing status

### AI Features

-   Semantic product search using `all-MiniLM-L6-v2`
-   FAISS vector similarity search
-   Product recommendations from:
    -   Another product
    -   A natural-language query
-   DistilBERT-based review sentiment classification
-   Confidence score returned with sentiment predictions
-   Persisted FAISS product index
-   AI Lab page for experimenting with the AI functionality
-   Reproducible recommendation and sentiment evaluation scripts
-   Optional Amazon-review sentiment fine-tuning script

------------------------------------------------------------------------

## Technology Stack

  Area                Technology
  ------------------- ------------------------------------------------
  Frontend            Next.js 13, React 18, Tailwind CSS
  Application API     Next.js Route Handlers
  State Management    React Context (`GlobalContext`)
  Database            MongoDB + Mongoose
  Authentication      JWT + bcrypt/bcryptjs
  Validation          Joi
  Image Storage       Supabase Storage
  Payments            Stripe Checkout
  Notifications       React Toastify
  AI API              Python + FastAPI
  Embeddings          Sentence Transformers
  Embedding Model     `sentence-transformers/all-MiniLM-L6-v2`
  Vector Search       FAISS `IndexFlatIP`
  Sentiment Model     `EBSQ/amazon-sentiment-distilbert`
  ML Runtime          PyTorch / Transformers / Sentence Transformers
  Testing             Jest + React Testing Library
  Container Support   Dockerfile available for AI service

------------------------------------------------------------------------

## System Architecture

![ShopSense Architecture](public/architecture.png)

At a high level, ShopSense contains:

1.  Browser-based Next.js application
2.  Next.js Route Handlers
3.  MongoDB
4.  Supabase Storage
5.  Stripe Checkout
6.  Separate FastAPI AI service

``` text
                         ┌───────────────────────────┐
                         │          Browser          │
                         │                           │
                         │ React + Next.js UI        │
                         │ GlobalContext             │
                         │ Cookie + localStorage     │
                         └─────────────┬─────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
                    │ /api/...                            │ Direct image upload
                    │ JWT Authorization                   │
                    ▼                                     ▼
        ┌─────────────────────────┐            ┌─────────────────────┐
        │   Next.js Application   │            │ Supabase Storage    │
        │                         │            │                     │
        │ Pages + API Routes      │            │ Product images      │
        │ Auth + Business Logic   │            └─────────────────────┘
        └────────────┬────────────┘
                     │
                     ▼
              ┌───────────────┐
              │    MongoDB    │
              │               │
              │ Users         │
              │ Products      │
              │ Cart          │
              │ Addresses     │
              │ Orders        │
              └───────────────┘

AI flow:

        ┌──────────────────────┐
        │ Next.js Application  │
        └──────────┬───────────┘
                   │ HTTP
                   ▼
        ┌──────────────────────┐
        │ FastAPI AI Service   │
        │      :8000           │
        └──────────┬───────────┘
                   │
          ┌────────┴─────────┐
          ▼                  ▼
   Sentence Transformer   DistilBERT
   all-MiniLM-L6-v2       Sentiment Model
          │                  │
          ▼                  ▼
      Embeddings          Sentiment
          │
          ▼
       FAISS Index
          │
          ▼
      Top-K Results
```

------------------------------------------------------------------------

## AI/ML Architecture

ShopSense uses a separate Python service so that the machine-learning
workloads are isolated from the Next.js application.

### Semantic Search

Product information is converted into text using:

``` text
Product Name
      +
Description
      +
Category
      +
Delivery Information
      ↓
Product Text Representation
      ↓
Sentence Transformer
all-MiniLM-L6-v2
      ↓
Normalized Embedding
      ↓
FAISS IndexFlatIP
```

Search follows:

``` text
User Query
    ↓
Sentence Transformer
    ↓
Normalized Query Embedding
    ↓
FAISS Inner-Product Search
    ↓
Similarity Scores
    ↓
Top-K Products
```

The system uses normalized embeddings with FAISS `IndexFlatIP`, so the
inner product corresponds to cosine-style similarity for the normalized
vectors.

### Product Recommendation

Recommendations can be generated from either:

``` text
Product ID
    ↓
Product information
    ↓
Embedding
    ↓
FAISS similarity search
    ↓
Similar products
```

or:

``` text
Natural-language query
    ↓
Embedding
    ↓
FAISS similarity search
    ↓
Recommended products
```

When recommending from a product ID, the source product is removed from
the returned results.

### Review Sentiment

Review text is sent to the sentiment pipeline:

``` text
Review Text
    ↓
DistilBERT
    ↓
Positive / Negative
    +
Confidence Score
```

The configured default model is:

``` text
EBSQ/amazon-sentiment-distilbert
```

### AI Service Persistence

When the catalog is indexed, ShopSense persists:

``` text
ai-service/data/vector_index/products.faiss
ai-service/data/vector_index/catalog.json
```

The FastAPI service attempts to load these files at startup when they
exist.

------------------------------------------------------------------------

## Application Architecture

### Next.js Application

The Next.js application contains both the frontend and the backend API.

There is no separate Node/Express backend. API routes are implemented as
Next.js Route Handlers under:

``` text
src/app/api/**
```

### Stateless Authentication

Authentication uses JWTs.

``` text
Register
   ↓
bcrypt password hash
   ↓
MongoDB

Login
   ↓
Verify password
   ↓
Generate JWT
   ↓
Client stores token

Protected Request
   ↓
Authorization: Bearer <JWT>
   ↓
AuthUser middleware
   ↓
Verify JWT
   ↓
Route handler
```

The JWT contains:

``` text
id
email
role
```

The role determines whether the user can access customer-only or
admin-only functionality.

### Product Image Flow

Product images do not pass through the Next.js API.

``` text
Admin selects image
       ↓
Browser validates file
       ↓
Direct upload to Supabase Storage
       ↓
Supabase returns public URL
       ↓
Next.js product API receives image URL
       ↓
MongoDB stores image URL
```

### Payment Flow

Stripe handles the hosted payment page.

``` text
Customer Checkout
       ↓
POST /api/stripe
       ↓
Stripe Checkout Session
       ↓
Stripe-hosted payment page
       ↓
Redirect to /checkout
       ↓
POST /api/order/create-order
       ↓
MongoDB
```

------------------------------------------------------------------------

## Project Structure

``` text
ShopSense/
│
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── account/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── product/
│   │   ├── admin-view/
│   │   ├── ai-lab/
│   │   ├── database/
│   │   ├── api/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── product/
│   │   │   ├── cart/
│   │   │   ├── address/
│   │   │   ├── order/
│   │   │   ├── stripe/
│   │   │   ├── admin/
│   │   │   └── ai/
│   │   │       ├── catalog/
│   │   │       ├── search/
│   │   │       ├── recommend/
│   │   │       └── sentiment/
│   │   ├── layout.js
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── Navbar/
│   │   ├── CommonListing/
│   │   ├── CommonDetails/
│   │   ├── CommonCart/
│   │   ├── CartModal/
│   │   ├── CommonModal/
│   │   ├── FormElements/
│   │   ├── Loader/
│   │   └── Notification/
│   │
│   ├── context/
│   │   └── index.js
│   │
│   ├── services/
│   │   ├── login/
│   │   ├── register/
│   │   ├── product/
│   │   ├── cart/
│   │   ├── address/
│   │   ├── order/
│   │   ├── stripe/
│   │   └── storage/
│   │
│   ├── middleware/
│   │   └── AuthUser.js
│   │
│   ├── models/
│   │   ├── user.js
│   │   ├── product.js
│   │   ├── cart.js
│   │   ├── address.js
│   │   └── order.js
│   │
│   └── lib/
│       └── supabase.js
│
├── ai-service/
│   ├── app/
│   │   └── main.py
│   ├── scripts/
│   │   ├── train_sentiment_amazon.py
│   │   └── evaluate.py
│   ├── data/
│   │   ├── recommendation_test.example.csv
│   │   ├── recommendation_test_new.csv
│   │   └── sentiment_test.example.csv
│   ├── requirements.txt
│   ├── requirements-train.txt
│   ├── .env.example
│   └── Dockerfile
│
├── public/
│   └── architecture.png
│
├── AI_ML_DL_UPGRADE.md
├── package.json
└── .env.example
```

------------------------------------------------------------------------

## Authentication and Authorization

### Customer

Customers can:

-   Browse products
-   View product details
-   Manage their cart
-   Manage addresses
-   Checkout
-   View their orders

### Admin

Admins can additionally:

-   Create products
-   Update products
-   Delete products
-   View all orders
-   Update order processing status

Admin authorization is checked using the `role` field contained in the
authenticated JWT.

------------------------------------------------------------------------

## AI Features

### AI Lab

The project contains an AI Lab page:

``` text
/ai-lab
```

It can be used to experiment with the AI functionality.

### Refresh the AI Catalog

The Next.js endpoint:

``` text
POST /api/ai/catalog
```

reads products from MongoDB and sends the product information to the
FastAPI service.

The AI service then:

1.  Builds product text representations.
2.  Generates Sentence Transformer embeddings.
3.  Normalizes the embeddings.
4.  Creates a FAISS `IndexFlatIP`.
5.  Adds the embeddings to the index.
6.  Saves the FAISS index and catalog metadata.

------------------------------------------------------------------------

## Data Models

### User

  Field        Type     Description
  ------------ -------- -----------------------
  `name`       String   User name
  `email`      String   Login identifier
  `password`   String   bcrypt hash
  `role`       String   `customer` or `admin`

### Product

  Field            Type     Description
  ---------------- -------- ---------------------------
  `name`           String   Product name
  `description`    String   Product description
  `price`          Number   Product price
  `category`       String   `men`, `women`, or `kids`
  `sizes`          Array    Available sizes
  `deliveryInfo`   String   Delivery information
  `onSale`         String   Sale status
  `priceDrop`      Number   Discount percentage
  `imageUrl`       String   Supabase image URL

### Cart

  Field         Type       Description
  ------------- ---------- -------------------
  `userID`      ObjectId   User reference
  `productID`   ObjectId   Product reference
  `quantity`    Number     Quantity

### Address

  Field          Type       Description
  -------------- ---------- ----------------
  `userID`       ObjectId   User reference
  `fullName`     String     Recipient
  `address`      String     Address
  `city`         String     City
  `country`      String     Country
  `postalCode`   String     Postal code

### Order

  Field               Type       Description
  ------------------- ---------- ---------------------------------
  `user`              ObjectId   User reference
  `orderItems`        Array      Ordered products and quantities
  `shippingAddress`   Object     Delivery address
  `paymentMethod`     String     Payment method
  `totalPrice`        Number     Order total
  `isPaid`            Boolean    Payment status
  `paidAt`            Date       Payment timestamp
  `isProcessing`      Boolean    Admin processing status

------------------------------------------------------------------------

## Environment Variables

Create `.env.local` in the project root.

``` env
DATABASE_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/shopsense

SECRET_KEY=your_jwt_secret

PUBLIC_KEY=pk_test_xxxxxxxxx
PRIVATE_KEY=sk_test_xxxxxxxxx

NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=images

SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

SERVER=http://localhost:3000

AI_SERVICE_URL=http://localhost:8000
```

### Variable Reference

  Variable                                 Purpose
  ---------------------------------------- -------------------------------------
  `DATABASE_URL`                           MongoDB connection string
  `SECRET_KEY`                             JWT signing and verification secret
  `PUBLIC_KEY`                             Stripe publishable key
  `PRIVATE_KEY`                            Stripe secret key
  `NEXT_PUBLIC_SUPABASE_URL`               Supabase project URL
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`   Supabase browser-safe key
  `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`    Product image bucket
  `SUPABASE_SERVICE_ROLE_KEY`              Reserved server-side Supabase key
  `SERVER`                                 Application base URL
  `AI_SERVICE_URL`                         FastAPI service URL

> Never commit `.env.local` or real credentials to GitHub.

------------------------------------------------------------------------

## Getting Started

### Prerequisites

Install:

-   Node.js and npm
-   Python 3.10+
-   MongoDB Atlas or another reachable MongoDB instance
-   Supabase project
-   Stripe account in test mode

### 1. Clone the repository

``` bash
git clone <your-repository-url>
cd ShopSense
```

### 2. Install Next.js dependencies

``` bash
npm install
```

### 3. Configure environment variables

``` bash
cp .env.example .env.local
```

Update `.env.local` with your MongoDB, Stripe, Supabase, and AI service
configuration.

------------------------------------------------------------------------

## Running the AI Service

Open a terminal:

``` bash
cd ai-service
```

Create a virtual environment:

``` bash
python3 -m venv venv
```

Activate it:

### Linux/macOS

``` bash
source venv/bin/activate
```

### Windows

``` bash
venv\Scripts\activate
```

Install dependencies:

``` bash
pip install -r requirements.txt
```

Start FastAPI:

``` bash
python -m uvicorn app.main:app --reload --port 8000
```

The service will be available at:

``` text
http://localhost:8000
```

Health check:

``` bash
curl http://localhost:8000/health
```

The first model request may download the configured Hugging Face models.

------------------------------------------------------------------------

## Running ShopSense

From the project root:

``` bash
npm run dev
```

Open:

``` text
http://localhost:3000
```

During development, both services should be running:

``` text
┌─────────────────────────────┐
│ Next.js / ShopSense         │
│ http://localhost:3000       │
└──────────────┬──────────────┘
               │
               │ HTTP
               ▼
┌─────────────────────────────┐
│ FastAPI AI Service          │
│ http://localhost:8000       │
└─────────────────────────────┘
```

------------------------------------------------------------------------

## Using Semantic Search

The semantic search accepts natural-language queries rather than
requiring exact keyword matches.

Examples:

``` text
comfortable clothes for summer travel
```

``` text
warm outfit for winter
```

``` text
casual clothes for everyday wear
```

The request is processed as:

``` text
Query
  ↓
Sentence Transformer
  ↓
Normalized Query Embedding
  ↓
FAISS Search
  ↓
Similarity Ranking
  ↓
Top-K Products
```

Before searching, the product catalog must be indexed.

------------------------------------------------------------------------

## AI API Reference

The Next.js application exposes proxy endpoints under:

``` text
/api/ai/*
```

These endpoints forward requests to the FastAPI AI service using
`AI_SERVICE_URL`.

### Refresh Catalog

``` http
POST /api/ai/catalog
```

No request body is required.

Example:

``` bash
curl -X POST http://localhost:3000/api/ai/catalog
```

The endpoint reads all products from MongoDB and rebuilds the AI product
index.

### Semantic Search

``` http
POST /api/ai/search
```

Request:

``` json
{
  "query": "comfortable clothes for summer travel",
  "top_k": 8
}
```

Example:

``` bash
curl -X POST http://localhost:3000/api/ai/search \
  -H "Content-Type: application/json" \
  -d '{"query":"comfortable clothes for summer travel","top_k":8}'
```

### Product Recommendation

``` http
POST /api/ai/recommend
```

Using a product:

``` json
{
  "product_id": "PRODUCT_ID",
  "top_k": 6
}
```

Using a query:

``` json
{
  "query": "casual clothes for everyday wear",
  "top_k": 6
}
```

Example:

``` bash
curl -X POST http://localhost:3000/api/ai/recommend \
  -H "Content-Type: application/json" \
  -d '{"query":"casual clothes for everyday wear","top_k":6}'
```

### Sentiment Analysis

``` http
POST /api/ai/sentiment
```

Request:

``` json
{
  "text": "The fabric is comfortable and the fit is excellent."
}
```

Example:

``` bash
curl -X POST http://localhost:3000/api/ai/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text":"The fabric is comfortable and the fit is excellent."}'
```

The response contains:

``` json
{
  "success": true,
  "label": "positive",
  "score": 0.98,
  "model": "EBSQ/amazon-sentiment-distilbert"
}
```

### FastAPI Endpoints

The underlying AI service exposes:

  Endpoint                Purpose
  ----------------------- ---------------------------------
  `GET /health`           AI service and index status
  `POST /catalog/index`   Build the FAISS catalog index
  `POST /search`          Semantic product search
  `POST /recommend`       Product/query recommendations
  `POST /sentiment`       Review sentiment classification

------------------------------------------------------------------------

## E-Commerce API Reference

All application endpoints are implemented as Next.js Route Handlers.

Protected endpoints use:

``` http
Authorization: Bearer <JWT>
```

### Authentication

  Method   Endpoint          Purpose
  -------- ----------------- ----------------------------
  `POST`   `/api/register`   Create account
  `POST`   `/api/login`      Authenticate and issue JWT

### Products

  ----------------------------------------------------------------------------------------------------
  Method            Endpoint                                       Access            Purpose
  ----------------- ---------------------------------------------- ----------------- -----------------
  `GET`             `/api/admin/all-products`                      Public            Get all products

  `GET`             `/api/admin/product-by-id?id=PRODUCT_ID`       Public            Get one product

  `GET`             `/api/admin/product-by-category?id=CATEGORY`   Public            Get category
                                                                                     products

  `POST`            `/api/admin/add-product`                       Admin             Create product

  `PUT`             `/api/admin/update-product`                    Admin             Update product

  `DELETE`          `/api/admin/delete-product?id=PRODUCT_ID`      Admin             Delete product
  ----------------------------------------------------------------------------------------------------

### Cart

  ----------------------------------------------------------------------------------------------------
  Method            Endpoint                                       Access            Purpose
  ----------------- ---------------------------------------------- ----------------- -----------------
  `POST`            `/api/cart/add-to-cart`                        Authenticated     Add product

  `GET`             `/api/cart/all-cart-items?id=USER_ID`          Authenticated     Get cart

  `DELETE`          `/api/cart/delete-from-cart?id=CART_ITEM_ID`   Authenticated     Remove cart item
  ----------------------------------------------------------------------------------------------------

### Addresses

  ---------------------------------------------------------------------------------------------------
  Method            Endpoint                                      Access            Purpose
  ----------------- --------------------------------------------- ----------------- -----------------
  `POST`            `/api/address/add-new-address`                Authenticated     Add address

  `GET`             `/api/address/get-all-address?id=USER_ID`     Authenticated     Get addresses

  `PUT`             `/api/address/update-address`                 Authenticated     Update address

  `DELETE`          `/api/address/delete-address?id=ADDRESS_ID`   Authenticated     Delete address
  ---------------------------------------------------------------------------------------------------

### Orders and Checkout

  ----------------------------------------------------------------------------------------------
  Method            Endpoint                                 Access            Purpose
  ----------------- ---------------------------------------- ----------------- -----------------
  `POST`            `/api/stripe`                            Authenticated     Create Stripe
                                                                               Checkout Session

  `POST`            `/api/order/create-order`                Authenticated     Create order
                                                                               after checkout

  `GET`             `/api/order/get-all-orders?id=USER_ID`   Authenticated     Get user's orders

  `GET`             `/api/order/order-details?id=ORDER_ID`   Authenticated     Get order details

  `GET`             `/api/admin/orders/get-all-orders`       Admin             Get all orders

  `PUT`             `/api/admin/orders/update-order`         Admin             Update order
                                                                               status
  ----------------------------------------------------------------------------------------------

------------------------------------------------------------------------

## AI Evaluation

Evaluation utilities are included under:

``` text
ai-service/scripts/
```

### Recommendation Evaluation

The recommendation evaluation uses:

``` text
query,relevant_product_ids
```

where `relevant_product_ids` contains comma-separated relevant product
IDs.

Example:

``` bash
python scripts/evaluate.py \
  --recommendation-csv data/recommendation_test.csv \
  --k 5
```

### Sentiment Evaluation

The sentiment evaluation uses:

``` text
text,label
```

where labels are:

``` text
positive
negative
```

Run:

``` bash
python scripts/evaluate.py \
  --sentiment-csv data/sentiment_test.csv
```

The project documentation specifies evaluation using
retrieval/recommendation metrics such as **Precision@K** and sentiment
**F1**.

> Do not report evaluation metrics unless the evaluation scripts have
> actually been run on the intended held-out dataset.

------------------------------------------------------------------------

## Sentiment Fine-Tuning

A reproducible fine-tuning script is included:

``` text
ai-service/scripts/train_sentiment_amazon.py
```

The project also includes:

``` text
ai-service/requirements-train.txt
```

Install the training dependencies before running the fine-tuning
workflow.

The documented training workflow uses the **Amazon Polarity** dataset
with DistilBERT.

------------------------------------------------------------------------

## Testing

Run the test suite:

``` bash
npm test
```

Watch mode:

``` bash
npm run test:watch
```

Coverage:

``` bash
npm run test:coverage
```

The project includes Jest and React Testing Library-based tests.

------------------------------------------------------------------------

## Production Build

### Next.js

Build:

``` bash
npm run build
```

Start:

``` bash
npm start
```

### FastAPI

Run Uvicorn without reload:

``` bash
source ai-service/venv/bin/activate

uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000
```

For production deployment, configure the environment variables for the
target infrastructure and use an appropriate process manager/container
configuration.

------------------------------------------------------------------------

## Known Limitations

-   There is no password-reset flow.
-   JWTs do not have server-side revocation. Clearing the client-side
    token during logout does not invalidate an already-issued token
    before its expiration.
-   Deleting a product removes the MongoDB product record but does not
    remove its corresponding Supabase Storage object, so unused image
    files can remain.
-   `SUPABASE_SERVICE_ROLE_KEY` is reserved for future server-side
    storage operations and is not currently used by the active storage
    flow.
-   The current product-image upload flow uses the browser-safe Supabase
    publishable key.
-   The AI catalog must be refreshed when the product catalog changes if
    the latest products are expected to be available to semantic
    search/recommendation.
-   AI model files may be downloaded the first time the corresponding
    models are loaded.
-   Evaluation metrics should only be reported after running the
    provided evaluation scripts on the relevant held-out dataset.

------------------------------------------------------------------------

## Development Notes

The main application and AI service are intentionally separated:

``` text
Next.js
├── UI
├── Authentication
├── E-Commerce logic
├── MongoDB access
├── Stripe integration
├── Supabase integration
└── AI API proxy
          │
          ▼
FastAPI
├── Sentence Transformers
├── FAISS
├── Product search
├── Product recommendation
└── DistilBERT sentiment analysis
```

This separation keeps the Python ML dependencies and inference workloads
outside the Next.js application while allowing the frontend to interact
with AI functionality through simple HTTP endpoints.

------------------------------------------------------------------------

## License

This project is intended for educational, portfolio, and development
use.
