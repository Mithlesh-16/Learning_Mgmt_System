# Learning Management System (LMS)

A backend-focused Learning Management System built with Node.js, Express, and MongoDB.

The project started as an exploration of how a real learning platform can be structured around authentication, role-based access, course management, subscriptions, media storage, and password recovery. The backend is organized into separate layers for routes, controllers, models, middleware, configuration, and utilities.

## Overview

The LMS provides the core backend functionality required by an online learning platform.

A user can create an account, log in, manage their profile, subscribe to the platform, and access courses based on their subscription status. Administrators have additional privileges for creating, updating, deleting, and managing courses and lectures.

The application also integrates external services for specific parts of the system:

- **MongoDB** for persistent data storage
- **Cloudinary** for image/media storage
- **Razorpay** for subscription payments
- **Nodemailer** for password-reset emails

The current repository mainly contains the backend implementation. A small HTML page is included separately to test the Razorpay subscription checkout flow.

---

## What the system currently supports

### User authentication

The authentication system supports:

- User registration
- User login and logout
- JWT-based authentication
- Password hashing with bcrypt
- Profile retrieval
- Profile updates
- Avatar upload
- Change password
- Forgot-password flow
- Password reset using a time-limited token

Passwords are never stored in plain text. Before a user document is saved, the password is hashed using `bcryptjs`.

After registration or login, the server generates a JWT and stores it in an HTTP cookie named `user_info`.

---

## Role-based access control

The system currently defines two roles:

- `USER`
- `ADMIN`

Authenticated routes can be protected using middleware depending on the required role.

For example:

- Regular users can access their profile and subscription-related functionality.
- Administrators can create, update, and delete courses.
- Course content is protected so that non-admin users need an active subscription to access it.

The authorization logic is handled centrally in the authentication middleware instead of being duplicated across individual controllers.

---

## Course management

Courses are stored in MongoDB using a dedicated Mongoose model.

A course contains:

- Title
- Description
- Category
- Thumbnail
- Lectures
- Number of lectures
- Creator information
- Timestamps

Administrators can:

- Create a course
- Update a course
- Delete a course
- Add lectures to a course

Course thumbnails and lecture media are uploaded through the server using `multer` and then sent to Cloudinary for storage.

---

## Subscription and payment system

The LMS uses **Razorpay subscriptions** for the paid-access layer of the platform.

The payment flow is split into a few steps rather than trusting the client alone.

### Subscription flow

```text
User
  |
  | 1. Request subscription
  v
Express API
  |
  | 2. Create Razorpay subscription
  v
Razorpay
  |
  | 3. Return subscription ID
  v
Express API
  |
  | 4. Store subscription ID/status
  v
MongoDB
  |
  | 5. Client completes checkout
  v
Razorpay
  |
  | 6. Payment details + signature
  v
Verify API
  |
  | 7. Validate subscription ID
  | 8. Generate HMAC signature
  v
MongoDB
  |
  | 9. Mark user subscription as active
  v
Course access
```

The server verifies the Razorpay signature using HMAC-SHA256 before marking the user's subscription as active.

Payment records containing the Razorpay payment ID, subscription ID, and signature are stored in the `Payment` collection.

Administrators can also query Razorpay subscription information through the payments module.

---

## How course access works

Course access is tied to the user's subscription status.

The request flow is:

```text
Client
  |
  | GET /api/v1/courses/:id
  v
isLoggedIn middleware
  |
  | Verify JWT from cookie
  v
authorizedSubscriber middleware
  |
  | Check user role
  | Check subscription.status
  v
Course Controller
  |
  | Fetch course from MongoDB
  v
MongoDB
  |
  v
Course / Lecture Response
```

An administrator can access protected course content without purchasing a subscription.

A regular user must have:

```text
subscription.status === "active"
```

to pass the subscriber authorization middleware.

---

# System Architecture

The backend follows a layered structure. Instead of placing all logic inside the route definitions, requests move through different layers with each layer handling a specific responsibility.

```text
                         ┌──────────────────────┐
                         │       Client         │
                         │ Browser / API Client │
                         └──────────┬───────────┘
                                    │
                                    │ HTTP Request
                                    v
                         ┌──────────────────────┐
                         │    Express Server    │
                         │       app.js         │
                         └──────────┬───────────┘
                                    │
                                    v
                         ┌──────────────────────┐
                         │       Routes         │
                         │ user / course /     │
                         │ payment routes      │
                         └──────────┬───────────┘
                                    │
                                    v
                  ┌────────────────────────────────┐
                  │          Middleware             │
                  │                                │
                  │ JWT Authentication             │
                  │ Role Authorization             │
                  │ Subscription Authorization     │
                  │ File Upload Handling            │
                  │ Error Handling                 │
                  └───────────────┬────────────────┘
                                  │
                                  v
                  ┌────────────────────────────────┐
                  │          Controllers            │
                  │                                │
                  │ User Controller                 │
                  │ Course Controller               │
                  │ Payment Controller              │
                  └───────────────┬────────────────┘
                                  │
                                  v
                  ┌────────────────────────────────┐
                  │          Data Models            │
                  │                                │
                  │ User                            │
                  │ Course                          │
                  │ Payment                         │
                  └───────────────┬────────────────┘
                                  │
                                  v
                         ┌──────────────────┐
                         │     MongoDB      │
                         │                  │
                         │ users            │
                         │ courses          │
                         │ payments         │
                         └──────────────────┘

                    External Services
                    ──────────────────

              ┌──────────────┐   ┌──────────────┐
              │  Cloudinary  │   │   Razorpay   │
              │ Media Store  │   │  Payments    │
              └──────▲───────┘   └──────▲───────┘
                     │                  │
                     └──────────┬───────┘
                                │
                          Controllers

                         ┌──────────────┐
                         │  Nodemailer  │
                         │ Password     │
                         │ Reset Email  │
                         └──────▲───────┘
                                │
                           User Controller
```

---

# Request lifecycle

One of the main design decisions in the project is keeping request handling, authentication, business logic, and persistence separated.

A typical request follows this path:

```text
HTTP Request
     |
     v
Express Route
     |
     v
Middleware
     |
     +---- Authentication
     |
     +---- Authorization
     |
     +---- File Upload
     |
     v
Controller
     |
     +---- Validate input
     |
     +---- Execute business logic
     |
     +---- Call external service if required
     |
     +---- Read/write MongoDB
     |
     v
HTTP Response
```

This makes the server easier to understand and gives each part of the application a clear responsibility.

---

# Authentication flow

## Registration

```text
User submits:
name + email + password + optional avatar
                    |
                    v
             Register Route
                    |
                    v
           User Controller
                    |
             Check email
                    |
        ┌───────────┴───────────┐
        |                       |
     Exists                  New user
        |                       |
      Error             Create MongoDB user
                                |
                         Hash password
                                |
                       Upload avatar
                         to Cloudinary
                                |
                       Generate JWT
                                |
                   Store JWT in cookie
                                |
                                v
                          User Response
```

The `User` schema contains validation for fields such as email and password length, and the password field is configured so it is not returned by normal queries.

---

## Login

```text
Email + Password
       |
       v
Login Route
       |
       v
User Controller
       |
       v
Find user by email
       |
       v
Compare password using bcrypt
       |
   ┌───┴────┐
   |        |
Invalid    Valid
   |        |
 Error      Generate JWT
            |
            v
       Set user_info cookie
            |
            v
       Return user data
```

---

## Forgot password flow

The password recovery process is handled through a temporary reset token.

```text
User enters email
        |
        v
Find user
        |
        v
Generate random reset token
        |
        v
Hash token before storing
        |
        v
Store token + expiry
        |
        v
Generate reset URL
        |
        v
Nodemailer
        |
        v
User receives email
        |
        v
Submit new password
        |
        v
Hash received reset token
        |
        v
Find valid token that has not expired
        |
        v
Update password
        |
        v
Remove reset token
```

The reset token is configured to expire after a limited period rather than remaining valid indefinitely.

---

# Media upload flow

Course thumbnails and user avatars use `multer` as the first stage of file handling.

The flow is:

```text
Client uploads image/video
          |
          v
       Multer
          |
          | temporary local file
          v
      Controller
          |
          v
       Cloudinary
          |
          | secure_url + public_id
          v
       MongoDB
          |
          v
  Store media references
```

The system stores Cloudinary identifiers and URLs in MongoDB rather than keeping the actual media inside the database.

Temporary uploaded files are removed after the upload process.

The current upload middleware accepts:

- PNG
- JPG
- JPEG
- WebP
- MP4

and limits uploaded files to 50 MB.

---

# Data model

The application currently uses three main Mongoose models.

## User

```text
User
├── fullName
├── email
├── password
├── avatar
│   ├── public_id
│   └── secure_url
├── role
├── forgotPasswordToken
├── forgotPasswordExpiry
├── subscription
│   ├── id
│   └── status
├── createdAt
└── updatedAt
```

The subscription information is kept on the user document so the authorization middleware can quickly determine whether the user is subscribed.

---

## Course

```text
Course
├── title
├── description
├── category
├── thumbnail
│   ├── public_id
│   └── secure_url
├── lectures[]
│   ├── title
│   ├── description
│   └── lecture
│       ├── public_id
│       └── secure_url
├── numberOfLectures
├── createdBy
├── createdAt
└── updatedAt
```

Lectures are embedded inside the course document.

---

## Payment

```text
Payment
├── razorpay_payment_id
├── razorpay_subscription_id
└── razorpay_signature
```

Payment records are stored separately from the user and course documents.

---

# API structure

The API is grouped into three major modules.

## User APIs

Base path:

```text
/api/v1/users
```

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Login |
| GET | `/profile` | Get logged-in user's profile |
| GET | `/logout` | Logout |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password/:token` | Reset password |
| POST | `/change-password` | Change password |
| PUT | `/profile-update/` | Update profile |

---

## Course APIs

Base path:

```text
/api/v1/courses
```

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Get courses |
| POST | `/` | Create a course (Admin) |
| GET | `/:id` | Access course content |
| PUT | `/:id` | Update course (Admin) |
| DELETE | `/:id` | Delete course (Admin) |
| POST | `/:id` | Add a lecture to a course (Admin) |

Course creation and lecture upload use the multipart upload middleware.

---

## Payment APIs

Base path:

```text
/api/v1/payments
```

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/razorpay-key` | Get Razorpay public key |
| POST | `/subscribe` | Create a subscription |
| POST | `/verify` | Verify a payment |
| POST | `/unsubscribe` | Cancel a subscription |
| GET | `/` | Retrieve subscription/payment information (Admin) |

---

# Folder structure

```text
LMS
│
├── front.html
│
├── uploads/
│   └── ...
│
└── server/
    │
    ├── app.js
    ├── server.js
    ├── package.json
    ├── package-lock.json
    │
    ├── config/
    │   └── dbConnection.js
    │
    ├── controller/
    │   ├── user.controller.js
    │   ├── course.controller.js
    │   └── payment.controller.js
    │
    ├── middlewares/
    │   ├── auth.middleware.js
    │   ├── error.middleware.js
    │   └── multer.middleware.js
    │
    ├── models/
    │   ├── user.model.js
    │   ├── course.model.js
    │   └── payment.model.js
    │
    ├── routes/
    │   ├── user.routes.js
    │   ├── course.routes.js
    │   └── payment.routes.js
    │
    └── utils/
        ├── error.util.js
        ├── multer.util.js
        └── sendEmail.js
```

---

# Technologies used

## Backend

- **Node.js**
- **Express.js**

## Database

- **MongoDB**
- **Mongoose**

## Authentication & Security

- **JSON Web Tokens (JWT)**
- **bcryptjs**
- **cookie-parser**

## Payments

- **Razorpay**

## File & Media Handling

- **Multer**
- **Cloudinary**

## Email

- **Nodemailer**

## Middleware / Utilities

- **CORS**
- **Morgan**
- **dotenv**
- **Nodemon**

---

# Environment variables

The server uses environment variables for configuration and secrets.

Typical configuration includes:

```env
PORT=
MONGO_URL=

JWT_SECRET=
JWT_EXPIRY=

FRONTEND_URL=
NODE_ENV=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_SECRET=
RAZORPAY_PLAN_ID=

SMTP_HOST=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
```

Do not commit the `.env` file to GitHub.

---

# Running the project locally

## 1. Clone the repository

```bash
git clone https://github.com/Mithlesh-16/LMS.git
cd LMS/server
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create a `.env` file inside the `server` directory and add the required values.

## 4. Start the server

```bash
npm start
```

The server uses `nodemon`, so changes to the backend can be picked up automatically during development.

---

# Development notes

The project is currently focused on the backend side of the LMS.

The `front.html` file in the root directory is a small standalone page used for testing the Razorpay subscription checkout flow. It is not intended to represent the complete frontend of the LMS.

The repository is still under development, and some parts of the application can be extended further, especially around frontend integration, course-content delivery, testing, and production deployment.

---

# Possible next improvements

Some areas I would like to improve as the project evolves:

- Build a dedicated frontend for students and administrators
- Add automated API tests
- Improve validation and error handling
- Add course progress tracking
- Add lecture completion tracking
- Add richer admin analytics
- Improve payment reconciliation and subscription lifecycle handling
- Add production deployment and monitoring
- Improve API documentation with Swagger/OpenAPI

---

## Author

**Mithlesh Kumar**

GitHub: https://github.com/Mithlesh-16