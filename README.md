[![npm version](https://img.shields.io/npm/v/nodejs-boiler.svg)](https://www.npmjs.com/package/nodejs-boiler)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

# 🚀 Node.js Boilerplate Generator

A powerful CLI tool to instantly generate production-ready Node.js applications with MongoDB integration. This boilerplate is designed to kickstart your backend development with best practices, security, and scalability in mind.

## 🎯 Why This Project?

Building a new Node.js project from scratch involves repetitive setup tasks, configuration, and boilerplate code. This project aims to:

- **Save Development Time**: Eliminate days of initial setup and configuration
- **Enforce Best Practices**: Follows industry standards for security, performance, and maintainability
- **Scalable Architecture**: Built with scalability and maintainability in mind
- **Database Flexibility**: Seamlessly switch between MongoDB and SQL databases
- **Production Ready**: Includes essential features like authentication, error handling, and logging

## ✨ Features

### Core Features
- 🏗️ **One-command project generation** - Get started in seconds
- 🚀 **Express.js** with modern ES modules (ESM)
- 🔒 **JWT Authentication** with role-based access control
- 🛠️ **Environment-based** configuration
- 📝 **API documentation** with Swagger/OpenAPI

### 🗄️ MongoDB Features
- **Mongoose ODM** for elegant MongoDB object modeling
- **Schema Validation** - Enforce data integrity
- **Middleware Support** - Pre/post hooks for business logic
- **Connection Pooling** - Optimized database connections
- **Transaction Support** - ACID transactions
- **Indexing** - Optimized query performance
- **Aggregation Pipeline** - Powerful data processing

### SQL Features
- **Sequelize ORM** for SQL databases
- Support for PostgreSQL, MySQL, SQLite, MSSQL
- Database migrations and seeders
- Connection pooling and transactions

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm 6.x or higher


### Step 1: Install the Boilerplate
Choose one of the following methods:

#### Method 1: Using npx (Recommended)
```bash
# Create a new project
npx nodejs-boiler
```

#### Method 2: Global Installation
```bash
# Install globally
npm install -g nodejs-boiler

# Create new project
nodejs-boiler
```


### Step 2: Verify Installation
1. Start your application:
   ```bash
   # Development mode with hot-reload
   npm run dev

   # Or production mode
   npm start
   ```

## ⚙️ Project configuration

### 1. Environment Configuration
Create a `.env.example` file in your project root.

### 2. Database Connection
Your application automatically connects to database on startup. The connection is managed in `src/db` folder.

### 3. Verify the Connection
1. Check the console for successful MongoDB connection message
2. Check the Api working Visit `http://localhost:8080/`
3. Visit `http://localhost:8080/health` for API health status
4. Access Swagger docs at `http://localhost:8080/api/docs`


### Quick Start

```bash
# Using npx (recommended)
npx nodejs-boiler@latest

# Or install globally
npm install -g nodejs-boiler
nodejs-boiler

# Select a folder:
❯ New directory
  Current directory

# Project folder Name:
(nodejs_boiler-app) or your_folder_name

# Select a database:
❯ mongodb
  postgresql

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```


### Key Features of the User Model:
- **Schema Validation**: Built-in validation for all fields
- **Password Hashing**: Automatic password hashing before save
- **Security**: Passwords are not returned by default
- **Timestamps**: Automatic `createdAt` and `updatedAt` fields
- **Role-based Access**: User roles with 'user' and 'admin' options


## Project Structure 📂

```
project-root/
├── docs/
│   └── swagger.json              # All apis swagger json files
|
├── logs/                         # Documentation Folder
|
├── src/
│   ├── configs/                  # Configuration files
│   │   └── envConfig.js          # Application configurations
│   │
│   ├── controllers/              # Route controllers
│   │   ├── index.js
│   │   └── user.controller.js
│   │
│   ├── db/                       # Database configuration
│   │
│   ├── helpers/                  # Helper functions
│   │   ├── logger.js
│   │   ├── mail.js
│   │   └── pick.js
│   │
│   ├── middlewares/              # Express middlewares
│   │   ├── auth.js
│   │   └── schemaValidation.js
│   │
│   ├── models/                   # MongoDB models
│   │   └── user.model.js
│   │
│   ├── routes/                   # API routes
│   │   ├── docs.routes.js
│   │   ├── index.js
│   │   └── user.routes.js
│   │
│   ├── utils/                    # Utility functions
│   │   ├── message.js
│   │   └── responses.js
│   │
│   ├── validations/              # Request validations
│   │   ├── index.js
│   │   └── user.validation.js
│   │
│   └── index.js                  # Application entry point
│
├── .env.example                  # Environment variables example file
├── .gitignore                    # Git ignore file
├── package.json                  # Project dependencies
└── README.md                     # Project documentation
```

## 🏆 Best Practices ✅

### Code Style
- Write meaningful commit messages
- Document your code with JSDoc

### Security
- Always use environment variables for sensitive data
- Implement proper input validation
- Use parameterized queries to prevent SQL injection
- Implement rate limiting and CORS

### Performance
- Use database indexing for frequently queried fields
- Implement caching where appropriate
- Optimize database queries
- Use connection pooling for database connections

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/AjayDumaraliya19/nodejs-boiler/issues).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author 👨‍💻

- **Ajay Dumaraliya** - [GitHub](https://github.com/AjayDumaraliya19)

## 🌟 Support

If you find this project helpful, please consider giving it a ⭐️ on [GitHub](https://github.com/AjayDumaraliya19/nodejs-boiler).

## Acknowledgments
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) / [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/)