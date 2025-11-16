![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-5.x-black?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-blue?logo=postgresql)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Status](https://img.shields.io/badge/Production-Ready-success.svg)

> This is a **production-ready boilerplate** for building scalable **RESTful APIs** using Node.js, Express, and PostgreSQL.
> It includes built-in authentication, reusable utilities, centralized error handling, API documentation, and more — to help you start your project instantly.

---

## 🧩 Features

✅ JWT-based Authentication (login/register)
✅ Role-based Access Control
✅ CRUD API Examples with PostgreSQL
✅ Swagger API Documentation (`/api/docs`)
✅ Centralized Error Handling
✅ Request Validation with Joi
✅ Logging with log4js
✅ Email Support with Nodemailer
✅ Rate Limiting & CORS Configuration
✅ Environment-based Configuration
✅ Security Best Practices (Helmet, Rate Limiting)

---

## 📦 Prerequisites

- Node.js (v18.0.0 or higher)
- PostgreSQL (v14.0 or higher)
- npm (v8.0.0 or higher) or yarn

---

## 🏗️ Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 5.x
- **Database:** PostgreSQL with node-postgres (pg)
- **API Documentation:** Swagger UI with swagger-jsdoc
- **Validation:** Joi
- **Authentication:** JSON Web Tokens (JWT)
- **Security:** Helmet, express-rate-limit
- **Logging:** log4js
- **Email:** Nodemailer
- **Environment:** dotenv

---

## 🔒 Security Best Practices

- **Helmet** - Sets various HTTP headers for security
- **Rate Limiting** - Prevents brute-force and DDoS attacks
- **Environment Variables** - Secure storage of sensitive data
- **Input Validation** - Joi validation for all user inputs
- **CORS** - Configured with proper origin restrictions
- **Secure Session Management** - JWT with httpOnly cookies
- **Request Size Limiting** - Protects against large payload attacks
- **Password Hashing** - bcrypt with proper salt rounds
- **CSRF Protection** - Enabled for all state-changing operations
- **Security Headers** - XSS protection, MIME-type sniffing prevention

## 📁 Folder Structure

```
nodejs-boiler/
├── docs/                       # Documentation Folder
│  └── swagger.json             # API documentation file
├── logs/                       # Documentation Folder
├── scripts/                    # Scripts Folder
│  └── initAdmin.js             # initial Admin Data create file
├── src/                        # Source Folder
│  ├── configs/                 # Configuration folder
│  │  └── envConfig.js          # Environment variables configuration file
│  ├── controllers/             # Route controllers folder
│  │  ├── user.controllers.js   # User controllers file
│  │  └── index.js              # Main controllers file (contains all controllers)
│  ├── db/                      # Database folder
│  │  └── mongooseDB.js         # Database connection file
│  ├── helpers/                 # Custom helpers folder
│  │  ├── logger.js             # Logger helper file (contains logging utilities for the logging the requests and responses using log4js)
│  │  ├── mail.js               # Mail helper file (contains mail utilities for the sending the mail using nodemailer)
│  │  └── pick.js               # Pick helper file (contains pick utilities for the validation)
│  ├── middlewares/             # Custom Express middlewares folder
│  │  ├── auth.js               # Authentication middleware file (contains authentication utilities)
│  │  └── schemaValidation.js   # Schema validation middleware file (contains schema validation utilities)
│  ├── models/                  # Database models folder
│  │  └── userModel.js          # User model file (contains user model)
│  ├── routes/                  # Route definitions folder
│  │  ├── user.routes.js        # User routes file (contains all user routes)
│  │  ├── docs.routes.js        # Docs routes file (contains all swagger routes configuration using swagger-ui-express)
│  │  └── index.js              # Main routes file (contains all routes)
│  ├── utils/                   # Utility classes and functions folder
│  │  ├── responses.js          # Response helper file (contains all response utilities for standardized HTTP responses with status codes: 2xx, 4xx, 5xx)
│  │  └── message.js            # Message helper file (contains all message utilities)
│  ├── validations/             # Validation functions for the request validation folder
│  │  ├── user.validation.js    # User validation file (contains all user validation utilities)
│  │  └── index.js              # Main validation file (contains all validation utilities)
│  └── index.js                 # Application configuration and middleware setup
├── .env.example                # Environment variables example file
├── package.json                # Package configuration file
├── README.md                   # Project details
```

---

## 📦 Dependencies

### Core Dependencies

- `express` - Web framework
- `joi` - Object schema validation
- `bcryptjs` - Password hashing
- `mongoose` - MongoDB object modeling
- `jsonwebtoken` - JWT implementation
- `dotenv` - Environment variable management
- `cors` - Cross-Origin Resource Sharing
- `helmet` - Security headers
- `express-rate-limit` - Basic rate-limiting
- `log4js` - Logging
- `nodemailer` - Email sending
- `swagger-jsdoc` - API documentation
- `swagger-ui-express` - API documentation

### Development Dependencies

- `nodemon` - Development server with auto-reload

---

## ⚙️ Installation & Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Update Packages (optional)**

   ```bash
   npm update
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   # Example:
   PORT=8080                                # Change with your port
   NODE_ENV="development"                   # Change with your environment
   REQUEST_BODY_LIMIT="50mb"                # Change with your request body limit
   MONGODB_URL="mongodb://localhost:27017"  # Change with your MongoDB URL
   MONGODB_DB="nodejs_boiler"               # Change with your MongoDB database name
   JWT_SECRET="your_jwt_secret"             # Change with your JWT secret
   JWT_EXPIRES_IN="1d"                      # Change with your JWT expires in (1d, 1h, 1m, 1s)
   JWT_COOKIE_EXPIRES_IN=7                  # Change with your JWT cookie expires in
   CORS_ORIGIN="http://localhost:3000"      # Change with your CORS origin
   RATE_LIMIT_WINDOW_MS=900000              # Change with your rate limit window ms (15 minutes)
   RATE_LIMIT_MAX=100                       # Change with your rate limit max (100 requests per windowMs)
   EMAIL_PASS="xxxx xxxx xxxx xxxx"         # Change with your email password
   SENDER_USER="your_email@example.com"     # Change with your sender user
   ```

4. **Add Admin data get credential (admin)**

   ```bash
   npm run init:admin
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

---

Server will start on:
👉 http://localhost:8080

---

## 🛣️ Available Routes

Below is the complete list of routes included in `nodejs-boiler`.
They are grouped as **Public**, **Protected (Authenticated)**, and **Admin-only** routes.

---

### 🌍 **Public Routes** (No Authentication Required)

| Method  | Endpoint                    | Description                     |
| ------- | --------------------------- | ------------------------------- |
| `POST`  | `/api/auth/register`        | Register a new user (user only) |
| `POST`  | `/api/auth/login`           | Login and receive JWT token     |
| `POST`  | `/api/auth/forgot-password` | Request password reset link     |
| `PATCH` | `/api/auth/reset-password`  | Reset password using token      |

**Notes:**

- Public routes are open to everyone.
- Validation is handled using `schemaValidation.js` and `userValidation` rules.

---

### 🔐 **Protected Routes** (Require Authentication)

| Method  | Endpoint                    | Description                      |
| ------- | --------------------------- | -------------------------------- |
| `GET`   | `/api/auth/me`              | Get the logged-in user’s profile |
| `PATCH` | `/api/auth/update-me`       | Update your own profile details  |
| `PATCH` | `/api/auth/update-password` | Update your account password     |

**Notes:**

- Protected routes require a valid `Bearer Token` in the Authorization header.
  Example:

```javascript
Authorization: Bearer <token>
```

---

### 🛡️ **Admin-only Routes**

| Method   | Endpoint                        | Description                 |
| -------- | ------------------------------- | --------------------------- |
| `GET`    | `/api/auth/admin/user/list`     | Get a list of all users     |
| `POST`   | `/api/auth/admin/user/pagelist` | Get paginated list of users |
| `GET`    | `/api/auth/admin/user`          | Get user details by ID      |
| `PATCH`  | `/api/auth/admin/user`          | Update user details by ID   |
| `DELETE` | `/api/auth/admin/user`          | Delete user by ID           |

**Notes:**

- Admin routes are protected using middleware:
- `protect` → verifies JWT authentication
- `restrictTo(['admin'])` → checks for admin role
- Only users with role `"admin"` can access these routes.

---

### 🧩 **Middlewares Used**

| Middleware              | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `protect`               | Ensures the user is authenticated                   |
| `restrictTo(["admin"])` | Restricts access to admins only                     |
| `validate(schema)`      | Validates request body using predefined schemas     |
| `schemaValidation.js`   | Centralized input validation                        |
| `auth.js`               | Handles JWT token verification and user permissions |

---

### 🧠 **Example Headers for Protected/Admin APIs**

```http
Authorization: Bearer <your_token_here>
Content-Type: application/json
```

## 📜 API Documentation

Swagger is available at:
👉 http://localhost:8080/api/docs

## 🛡️ Error Handling

> All errors are handled centrally using commonError.js middleware.
> Consistent response structure with responses.js.

> Example:

```javascript
return successResponse(res, "User created successfully", data);
return errorResponse(res, "Invalid credentials", 401);
```

## 🔒 Authentication

> Token-based authentication using JWT.
> Secure cookies supported for production.

> Example routes: /api/auth/register, /api/auth/login, /api/auth/logout.

## 🚀 API Usage Examples

### Authentication

#### Register a New User

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "yourSecurePassword123",
  "role": "user"
}
```

#### User Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "yourSecurePassword123"
}
```

### User Management

#### Get User Profile

```http
GET /api/v1/user/me
Authorization: Bearer your-jwt-token
```

#### Update User Profile

```http
PATCH /api/v1/user/update-me
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

### Admin Endpoints

#### Get All Users (Admin Only)

```http
GET /api/v1/user/admin/user/list
Authorization: Bearer your-admin-jwt-token
```

#### Delete User (Admin Only)

```http
DELETE /api/v1/user/admin/user?id=USER_ID
Authorization: Bearer your-admin-jwt-token
```

## Contributing

We welcome contributions! Here's how you can help:

1. **Report Bugs** - Open an issue to report bugs or request features
2. **Fix Issues** - Check out the open issues and submit a pull request
3. **Improve Documentation** - Help us improve the docs
4. **Spread the Word** - Star the repo and share it with others

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Express](https://expressjs.com/) - Fast, unopinionated web framework
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [JWT](https://jwt.io/) - JSON Web Tokens for authentication
- [Swagger](https://swagger.io/) - API Documentation

how to setup this file in direct PGadmin?
I'll help you set up the database schema and admin user in pgAdmin. Here's a step-by-step guide:

1.) Open pgAdmin and connect to your PostgreSQL server.
2.) Create a new database (if you haven't already):
Right-click on "Databases" in the left sidebar
Select "Create" > "Database"
Enter a name (e.g., nodejs_boilerplate)
Click "Save"
3.) Run the SQL script:
Right-click on your database
Select "Query Tool"
Copy the entire content of
setup_public_schema.sql
Paste it into the query editor
Click the "Execute" button (▶) or press F5
4.) Verify the setup:
In the left sidebar, expand your database
Expand "Schemas" > "public" > "Tables"
Right-click on "users" and select "View/Edit Data" > "All Rows"
You should see the admin user with username 'admin'
5.) Update database connection: Make sure your application's database configuration (in .env or config files) points to this database.
