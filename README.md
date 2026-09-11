# Learning Management System (LMS)

A full-stack Learning Management System built with the MERN stack, with a Node.js and Express backend and a React-based client planned as the frontend layer.

The project focuses on the backend architecture and core services required by an online learning platform, including authentication, role-based access control, course management, media uploads, subscriptions, payments, and password recovery.

The React client is being added on top of the existing API layer to provide separate experiences for students and administrators.

---

## Overview

The idea behind this project is to build an LMS in which the backend handles authentication, business logic, data management, payments, and protected course access, while the frontend communicates with the backend through REST APIs.

The current backend supports:

- User registration and authentication
- JWT-based authorization
- Role-based access control
- Course creation and management
- Lecture uploads
- User profile management
- Subscription management
- Razorpay payment integration
- Cloudinary media storage
- Password recovery through email

The next stage of the project is to build a React client that consumes these APIs and provides the actual user interface for students and administrators.

---

## Planned MERN Architecture

The overall application is being structured around the MERN stack:

```text
                 ┌────────────────────────────┐
                 │          Client            │
                 │       React.js             │
                 │                            │
                 │  Student Dashboard         │
                 │  Admin Dashboard           │
                 │  Course Pages              │
                 │  Authentication            │
                 │  Subscription / Payment    │
                 └─────────────┬──────────────┘
                               │
                        HTTP / REST APIs
                               │
                               ▼
                 ┌────────────────────────────┐
                 │       Node.js + Express    │
                 │          Backend           │
                 │                            │
                 │ Routes                     │
                 │ Middleware                 │
                 │ Controllers                │
                 │ Business Logic             │
                 └───────┬──────────┬─────────┘
                         │          │
                         │          │
                         ▼          ▼
                ┌─────────────┐  ┌──────────────────┐
                │  MongoDB    │  │ External Services│
                │             │  │                  │
                │ Users       │  │ Razorpay         │
                │ Courses     │  │ Cloudinary       │
                │ Payments    │  │ Nodemailer       │
                └─────────────┘  └──────────────────┘
```

The main idea is to keep the React client responsible for presentation and client-side state, while the Express backend remains responsible for authentication, authorization, business logic, database operations, and communication with external services.

---

# Features

## Authentication

The authentication system currently supports:

- User registration
- User login
- Logout
- JWT-based authentication
- Password hashing using bcrypt
- Profile retrieval
- Profile updates
- Avatar upload
- Change password
- Forgot-password flow
- Password reset using a temporary token

Passwords are hashed before being stored in MongoDB and are never stored in plain text.

After successful registration or login, the server generates a JWT and stores it in the `user_info` HTTP cookie.

---

## Role-Based Access Control

The application currently supports two roles:

```text
USER
ADMIN
```

Authorization is handled through middleware.

This allows the API to distinguish between:

- Public requests
- Authenticated users
- Subscribers
- Administrators

For example:

```text
                    Incoming Request
                           |
                           v
                    Authentication
                           |
                    ┌──────┴──────┐
                    │             │
                 Not logged     Logged in
                    │             │
                  Reject       Check role
                                  |
                         ┌────────┴────────┐
                         │                 │
                       USER              ADMIN
                         │                 │
                  Check subscription   Admin access
```

A regular user must have an active subscription before accessing protected course content, while administrators can manage courses and access protected resources without subscribing.

---

# Course Management

Courses are stored in MongoDB using Mongoose models.

A course contains information such as:

- Title
- Description
- Category
- Thumbnail
- Lectures
- Number of lectures
- Creator
- Timestamps

Administrators can:

- Create courses
- Update courses
- Delete courses
- Add lectures

Course thumbnails and lecture files are uploaded through the backend and stored using Cloudinary.

---

# Subscription and Payment System

The LMS uses Razorpay subscriptions for paid access to course content.

The payment process is handled through the backend rather than trusting payment information directly from the client.

## Payment flow

```text
React Client
     |
     | Request subscription
     v
Express API
     |
     | Create subscription
     v
Razorpay
     |
     | Subscription ID
     v
Express API
     |
     | Save subscription information
     v
MongoDB
     |
     | Client opens Razorpay Checkout
     v
Razorpay
     |
     | Payment response + signature
     v
Verification API
     |
     | Validate signature
     v
MongoDB
     |
     | Update subscription status
     v
Course Access
```

The server verifies the Razorpay signature before activating a user's subscription.

Payment information is stored separately in the `Payment` collection.

---

# How a request flows through the application

One of the main design goals of the backend is to keep the different responsibilities separated.

A typical request follows this path:

```text
React Client
     |
     | HTTP Request
     v
Express Route
     |
     v
Middleware
     |
     ├── Authentication
     ├── Authorization
     ├── File Upload
     └── Error Handling
     |
     v
Controller
     |
     ├── Validate request
     ├── Execute business logic
     ├── Call external services
     └── Read / write database
     |
     v
MongoDB / External Service
     |
     v
Controller
     |
     v
HTTP Response
     |
     v
React Client
```

This separation makes it easier to modify one part of the system without tightly coupling everything together.

---

# Example: Opening a protected course

Suppose a student opens a course from the React application.

The flow is:

```text
Student
   |
   v
React Course Page
   |
   | GET /api/v1/courses/:id
   v
Express Router
   |
   v
isLoggedIn Middleware
   |
   | Verify JWT
   v
authorizedSubscriber Middleware
   |
   | Check user role
   | Check subscription.status
   v
Course Controller
   |
   | Find course
   v
MongoDB
   |
   v
Course + Lecture Data
   |
   v
Express Response
   |
   v
React
   |
   v
Course Page
```

This means the frontend does not decide whether a user is allowed to view protected content. The final authorization decision is made by the backend.

---

# Authentication Flow

## Registration

```text
React Registration Form
          |
          v
POST /api/v1/users/register
          |
          v
User Controller
          |
          ├── Validate input
          ├── Check existing email
          ├── Hash password
          ├── Upload avatar (if provided)
          ├── Create user
          └── Generate JWT
                    |
                    v
              HTTP Cookie
                    |
                    v
              React Client
```

---

## Login

```text
React Login Form
       |
       v
POST /api/v1/users/login
       |
       v
User Controller
       |
       ├── Find user
       ├── Compare password using bcrypt
       └── Generate JWT
                    |
                    v
              user_info Cookie
                    |
                    v
              React Client
```

---

## Forgot Password

```text
User requests password reset
            |
            v
       User Controller
            |
            v
   Generate reset token
            |
            v
   Store hashed token + expiry
            |
            v
       Nodemailer
            |
            v
      User receives email
            |
            v
      Reset password
            |
            v
   Validate token + expiry
            |
            v
     Update password
```

The reset token is temporary and expires after a limited period.

---

# Media Upload Flow

The backend uses Multer for receiving uploaded files and Cloudinary for storing them.

```text
React Client
     |
     | multipart/form-data
     v
Multer Middleware
     |
     | Temporary file
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
Media reference stored
```

The database stores the Cloudinary URL and public ID rather than storing the actual media files inside MongoDB.

The current upload middleware supports:

- PNG
- JPG
- JPEG
- WebP
- MP4

with a maximum file size of 50 MB.

---

# Data Model

The current backend uses three primary Mongoose models.

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

Lectures are currently stored as part of the course document.

---

## Payment

```text
Payment
├── razorpay_payment_id
├── razorpay_subscription_id
└── razorpay_signature
```

Payment records are maintained separately from user and course documents.

---

# API Structure

## User APIs

Base path:

```text
/api/v1/users
```

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/register` | Register a user |
| POST | `/login` | Login |
| GET | `/profile` | Get current user profile |
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
| POST | `/` | Create a course |
| GET | `/:id` | Get course |
| PUT | `/:id` | Update a course |
| DELETE | `/:id` | Delete a course |
| POST | `/:id` | Add lecture |

Administrative endpoints are protected by the appropriate authentication and authorization middleware.

---

## Payment APIs

Base path:

```text
/api/v1/payments
```

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/razorpay-key` | Get Razorpay public key |
| POST | `/subscribe` | Create subscription |
| POST | `/verify` | Verify payment |
| POST | `/unsubscribe` | Cancel subscription |
| GET | `/` | Get payment/subscription information |

---

# Project Structure

The project is currently being developed as a MERN application.

The Express/MongoDB backend is implemented and provides the core REST API.
The React client is being developed on top of this API and will provide
student and administrator interfaces.
The project is being organized so that the React client and Express server remain separate.

```text
LMS
│
├── client/                         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── assets/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── server/                         # Node.js / Express backend
│   │
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   │
│   ├── config/
│   │   └── dbConnection.js
│   │
│   ├── controller/
│   │   ├── user.controller.js
│   │   ├── course.controller.js
│   │   └── payment.controller.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── multer.middleware.js
│   │
│   ├── models/
│   │   ├── user.model.js
│   │   ├── course.model.js
│   │   └── payment.model.js
│   │
│   ├── routes/
│   │   ├── user.routes.js
│   │   ├── course.routes.js
│   │   └── payment.routes.js
│   │
│   └── utils/
│       ├── error.util.js
│       ├── multer.util.js
│       └── sendEmail.js
│
├── uploads/
│
├── front.html
│
└── README.md
```

> The `client/` structure represents the planned React frontend and will evolve as the UI is implemented.

---

# Technology Stack

## Frontend

- React.js
- JavaScript
- HTML5
- CSS3
- React Router (planned)
- Axios / Fetch for API communication

## Backend

- Node.js
- Express.js

## Database

- MongoDB
- Mongoose

## Authentication & Security

- JSON Web Tokens (JWT)
- bcryptjs
- cookie-parser

## Payments

- Razorpay

## Media Storage

- Multer
- Cloudinary

## Email

- Nodemailer

## Development Tools

- Git
- GitHub
- Postman
- Nodemon
- dotenv
- Morgan
- CORS

---

# Frontend Architecture

The React client will sit on top of the existing REST API.

The frontend is planned around separate pages and reusable components.

```text
React Application
│
├── Authentication
│   ├── Login
│   ├── Register
│   ├── Forgot Password
│   └── Reset Password
│
├── Student Area
│   ├── Dashboard
│   ├── Course Listing
│   ├── Course Details
│   ├── Lecture Player
│   ├── Profile
│   └── Subscription
│
├── Admin Area
│   ├── Dashboard
│   ├── Course Management
│   ├── Lecture Management
│   └── User / Subscription Management
│
└── Shared Components
    ├── Navbar
    ├── Sidebar
    ├── Course Card
    ├── Forms
    ├── Loaders
    └── Protected Routes
```

The client will communicate with the backend through REST APIs rather than accessing MongoDB directly.

---

# Frontend ↔ Backend Communication

The intended communication flow is:

```text
React Component
      |
      v
API Service Layer
      |
      | HTTP Request
      v
Express Route
      |
      v
Middleware
      |
      v
Controller
      |
      v
MongoDB / External Service
      |
      v
JSON Response
      |
      v
React State
      |
      v
Updated UI
```

This keeps database credentials, payment secrets, JWT secrets, and external-service credentials on the server rather than exposing them to the browser.

---

# Environment Variables

The backend uses environment variables for configuration and credentials.

Example:

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

Do not commit `.env` files or secret keys to GitHub.

---

# Running the Backend Locally

## Clone the repository

```bash
git clone https://github.com/Mithlesh-16/LMS.git
cd LMS/server
```

## Install dependencies

```bash
npm install
```

## Configure environment variables

Create a `.env` file inside the `server` directory.

## Start the development server

```bash
npm start
```

---

# Current Development Status

The backend and its core services are already being developed around the following modules:

- Authentication
- Role-based authorization
- Course management
- Lecture management
- Subscription handling
- Razorpay integration
- Cloudinary integration
- Password recovery
- MongoDB persistence

The React client is the next major layer of the project.

The goal is to expose these backend capabilities through a clean web interface with separate student and administrator workflows.

---

# Planned Frontend Work

The React client will be developed incrementally.

### Phase 1 — Authentication

- Login
- Registration
- Logout
- Forgot password
- Reset password
- Protected routes

### Phase 2 — Student Experience

- Course listing
- Course details
- Lecture access
- Profile management
- Subscription status

### Phase 3 — Admin Experience

- Admin dashboard
- Course creation
- Course editing
- Lecture upload
- Course deletion
- User/subscription management

### Phase 4 — Payment Integration

- Subscription checkout
- Razorpay integration
- Payment verification
- Subscription status

---

# Future Improvements

Some areas I would like to work on as the project grows:

- Complete React frontend
- Course progress tracking
- Lecture completion tracking
- Admin analytics
- Automated API testing
- Better request validation
- API documentation with Swagger/OpenAPI
- Improved payment/subscription lifecycle handling
- Production deployment
- Application monitoring and logging

---

# Development Notes

The project is intentionally being developed in separate frontend and backend layers.

The existing backend exposes REST APIs that can be consumed by the React client. This makes it possible to develop and test the backend independently while gradually building the frontend around the same API contract.

The `front.html` file is a small standalone page used to test the Razorpay subscription checkout flow. It is not the final frontend of the application.

---

## Author

**Mithlesh Kumar**

GitHub: https://github.com/Mithlesh-16/LMS