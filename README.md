# 🚀 Node.js Boilerplate Generator

A powerful CLI tool to instantly generate production-ready Node.js applications with MongoDB integration. This boilerplate is designed to kickstart your backend development with best practices, security, and scalability in mind.

> ⚠️ **Note**: SQL database support is coming soon! Currently, this boilerplate focuses on MongoDB as the primary database.

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
- **Migrations** - Schema versioning and data migrations

### 🔜 Coming Soon (SQL Support)
- **Sequelize ORM** for SQL databases
- Support for PostgreSQL, MySQL, SQLite, MSSQL
- Database migrations and seeders
- Connection pooling and transactions

## 🚀 Getting Started

### Prerequisites

- Node.js 16.0.0 or higher
- npm 6.0.0 or higher

## 🛠 Installation & Setup

### Prerequisites
- Node.js 16.x or higher
- npm 6.x or higher
- MongoDB Community Server (v4.4 or later)
  - [Download MongoDB Community Server](https://www.mongodb.com/try/download/community)
  - [Installation Guide](https://docs.mongodb.com/manual/administration/install-community/)

### Step 1: Install MongoDB
1. **Windows**:
   - Download the MSI installer from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Run the installer and follow the setup wizard
   - Add MongoDB's `bin` directory to your system's PATH

2. **macOS (using Homebrew)**:
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   ```

3. **Linux (Ubuntu/Debian)**:
   ```bash
   sudo apt-get update
   sudo apt-get install -y mongodb
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

### Step 2: Install the Boilerplate
Choose one of the following methods:

#### Method 1: Using npx (Recommended)
```bash
# Create a new project
npx create-nodejs-boiler my-awesome-app
or
npm create nodejs-boiler my-awesome-app

# Navigate to project directory
cd my-awesome-app

# Install dependencies
npm install
```

#### Method 2: Global Installation
```bash
# Install globally
npm install -g nodejs-boiler

# Create new project
nodejs-boiler my-awesome-app

# Navigate to project directory
cd my-awesome-app

# Install dependencies
npm install
```

### Step 3: Verify Installation
1. Start MongoDB service if not running:
   ```bash
   # Windows
   net start MongoDB

   # macOS/Linux
   sudo systemctl start mongod
   ```

2. Verify MongoDB is running:
   ```bash
   mongosh --version
   ```

3. Start your application:
   ```bash
   # Development mode with hot-reload
   npm run dev

   # Or production mode
   npm start
   ```

4. Open your browser and visit: `http://localhost:8080/api-docs`
   - You should see the Swagger API documentation
   - The API should be connected to your local MongoDB instance

## ⚙️ MongoDB Configuration

### 1. Environment Configuration
Create a `.env` file in your project root with the following variables:

```env
# Application
NODE_ENV=development
PORT=8080

# Request Body Limit
REQUEST_BODY_LIMIT=your_request_limit   # like "50kb"

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=your_database_name

# JWT Secret Key Authentication
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRES_IN="1d"                     # Change with your JWT expires in (1d, 1h, 1m, 1s)
JWT_COOKIE_EXPIRES_IN=90                # Change with your JWT cookie expires in

# CORS Configuration
CORS_ORIGIN="http://localhost:8080"      # Change with your CORS origin

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000              # Change with your rate limit window ms (15 minutes)
RATE_LIMIT_MAX=100                       # Change with your rate limit max (100 requests per windowMs)

# Email Configuration
EMAIL_PASS="xxxx xxxx xxxx xxxx"         # Change with your email password
SENDER_USER="your_email@example.com"     # Change with your email address like "test@example.com"
```

### 2. Database Connection
Your application automatically connects to MongoDB on startup. The connection is managed in `src/db/mongooseDB.js`:

```javascript
const Mongoose = require("mongoose");
const { config } = require("../configs/envConfig.js");
const { setupLogger, logger } = require("../helpers/logger.js");

const logfile_folder = "database";

/* -------------------------------------------------------------------------- */
/*                        DATABASE CONNECTION FUNCTION                        */
/* -------------------------------------------------------------------------- */
const connectDB = async () => {
    setupLogger(logfile_folder);
    try {
        await Mongoose.connect(`${config.mongo.url}/${config.mongo.db}`);
        console.log("✅ Database connected successfully");

        /** == Database Connection Event == */
        Mongoose.connection.on("connected", () => {
            logger.info("Database connected successfully");
        });

        Mongoose.connection.on("error", (error) => {
            console.log("Database connection Error:", error?.message || "something went wrong..!");
            logger.error(`Database connection Error: ${error?.message || "something went wrong..!"}`);
        });
    } catch (error) {
        console.error("❌ Database connection failed:", error?.message);
        logger.error(`❌ Database connection failed: ${error?.message || "something went wrong..!"}\n\n`)
        throw new Error("Database connection failed");
    }
};

export default connectDB;
```

### 3. Start the Application

#### Development Mode (with hot-reload)
```bash
npm run dev
```

#### Production Mode
```bash
# Start in production
npm start
```

### 4. Verify the Connection
1. Check the console for successful MongoDB connection message
2. Check the Api working Visit `http://localhost:8080/`
3. Visit `http://localhost:8080/health` for API health status
4. Access Swagger docs at `http://localhost:8080/api-docs`

## 🗄 MongoDB Integration

### Database Connection
This project uses Mongoose to interact with MongoDB. The database connection is automatically established when the application starts.

## 🔒 Security Best Practices

### MongoDB Security
- Enable authentication in MongoDB
- Use SSL/TLS for database connections
- Implement proper indexing for performance
- Use connection pooling
- Enable database auditing

### Quick Start

```bash
# Using npx (recommended)
npx nodejs-boiler@latest my-awesome-app

# Or install globally
npm install -g nodejs-boiler
nodejs-boiler my-awesome-app

# Navigate to project directory
cd my-awesome-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Database Setup 🗃️

### MongoDB Setup

1. **Install MongoDB**
   - [Download and install MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Make sure MongoDB service is running

2. **Configuration**
   Update `.env` with your MongoDB connection string:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB=your_database_name
   ```

3. **Mongoose Models**
   Models are located in `src/models/`. Example user model:
   ```javascript
   // models/user.model.js
   const mongoose = require("mongoose");
   const bcrypt = require("bcryptjs");

   const userSchema = new mongoose.Schema({
     name: { type: String, required: true },
     email: { type: String, required: true, unique: true },
     password: { type: String, required: true, select: false },
     role: { type: String, enum: ["user", "admin"], default: "user" }
   }, { timestamps: true });

   // Hash password before saving
   userSchema.pre("save", async function(next) {
     if (!this.isModified("password")) return next();
     this.password = await bcrypt.hash(this.password, 12);
     next();
   });

   module.exports = mongoose.model("User", userSchema);
   ```

### Key Features of the User Model:
- **Schema Validation**: Built-in validation for all fields
- **Password Hashing**: Automatic password hashing before save
- **Security**: Passwords are not returned by default
- **Timestamps**: Automatic `createdAt` and `updatedAt` fields
- **Role-based Access**: User roles with 'user' and 'admin' options


### SQL Database Setup (PostgreSQL/MySQL/SQLite/MSSQL)

> SQL database support is coming soon!


## Project Structure 📂

```
project-root/
├── docs/
│   ├── swagger.json/             # All apis swagger json files
├── src/
│   ├── configs/                  # Configuration files
│   │   └── envConfig.js          # Application configurations
│   │
│   ├── controllers/              # Route controllers
│   │   ├── index.js
│   │   └── user.controller.js
│   │
│   ├── db/                       # Database configuration
│   │   └── mongoose.js           # MongoDB connection setup
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
├── .env                          # Environment variables
├── .gitignore                    # Git ignore file
├── package.json                  # Project dependencies
└── README.md                     # Project documentation
```

## Available Scripts 📜

### Development
- `npm run dev` - Start development server with hot-reload
- `npm run lint` - Lint and fix code
- `npm run format` - Format code with Prettier

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:e2e` - Run end-to-end tests

### Production
- `npm start` - Start production server
- `npm run build` - Build the application
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed the database

### Docker
- `docker-compose up` - Start all services (app + database)
- `docker-compose down` - Stop all services
- `docker-compose build` - Rebuild containers

## Environment Variables 🔧

Copy `.env.example` to `.env` and update the following variables:

```env
# Application
NODE_ENV=development
PORT=3000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=90d

# Database (MongoDB)
DB_TYPE=mongodb
MONGODB_URI=mongodb://localhost:27017/your_database
MONGODB_OPTIONS={"useNewUrlParser":true,"useUnifiedTopology":true}

# Database (SQL - Choose one)
# DB_TYPE=postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=your_database
# DB_USER=your_username
# DB_PASSWORD=your_password

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=15*60*1000
RATE_LIMIT_MAX=100
```

## API Documentation 📚

Once the server is running, access the API documentation at:
- Swagger UI: `http://localhost:3000/api-docs`
- OpenAPI JSON: `http://localhost:3000/api-docs.json`

## Deployment 🚀

### Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t nodejs-boiler .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 --env-file .env nodejs-boiler
   ```

### PM2 (Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start src/server.js --name "nodejs-boiler"

# Save process list
pm2 save

# Generate startup script
pm2 startup
```

## Best Practices ✅

### Code Style
- Follow the included ESLint and Prettier configurations
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

## Troubleshooting 🔧

### Common Issues
- **Database Connection Issues**: Verify database credentials and ensure the database server is running
- **Port Already in Use**: Change the PORT in .env or stop the process using the port
- **Module Not Found**: Run `npm install` to install dependencies

## Contributing 🤝

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author 👨‍💻

- **Ajay Dumaraliya** - [GitHub](https://github.com/AjayDumaraliya19)

## Support 💖

If you find this project helpful, please consider giving it a ⭐️ on [GitHub](https://github.com/AjayDumaraliya19/nodejs-boiler_) and sharing it with your network!

## Acknowledgments
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) / [Mongoose](https://mongoosejs.com/)
- [Sequelize](https://sequelize.org/)
- [JWT](https://jwt.io/)
- [Jest](https://jestjs.io/)