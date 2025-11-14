// ./src/index.js

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const ratelimit = require("express-rate-limit");

// Import configurations
const Routes = require("./routes/index.js");
const { config } = require("./configs/envConfig.js");
const { connectDB } = require("./db/connectionDB.js");
const { setupLogger, logger } = require("./helpers/logger.js");

/* -------------------------------------------------------------------------- */
/*                             INITIALIZE EXPRESS                             */
/* -------------------------------------------------------------------------- */
const app = express();
const port = config.port;

/* --------------------------- DATABASE CONNECTION -------------------------- */
// Initialize database connection with improved error handling
(async () => {
    try {
        await connectDB();
        console.log("✅ Database connected successfully");
    } catch (error) {
        console.error("❌ Failed to connect to the database:", error.message);
        console.error("Error details:", error);
        console.log("🛑 Shutting down the server...");
        process.exit(1);
    }
})();

/* --------------------------- REQUEST BODY PARSER -------------------------- */
app.use(express.json({ limit: config.limit }));
app.use(express.urlencoded({ extended: true, limit: config.limit }));

/* --------------------- SECURITY & PERFORMANCE HEADERS --------------------- */
app.use(helmet());
app.set("trust proxy", 1);  // Trust first proxy

/* ------------------------------ RATE LIMITER ------------------------------ */
const limiter = ratelimit({
    windowMs: config["rate-limit"].window_ms,
    max: config["rate-limit"].max,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later."
});
app.use("/api", limiter);

/* ------------------------------- CORS SETUP ------------------------------- */
const corsOptions = {
    origin: (origin, callback) => {
        setupLogger("server");

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Normalize the origin by removing trailing slashes and convert to lowercase
        const originNormalized = origin.toLowerCase().replace(/\/$/, "");
        const allowedOrigins = config.cors.origin.map(o => o.toLowerCase().replace(/\/$/, ""));
        if (allowedOrigins.includes(originNormalized)) {
            return callback(null, true);
        };

        logger.warn(`❌ Blocked CORS request from origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    exposedHeaders: ["Authorization", "X-Total-Count"]
};

// Use CORS with proper configuration
const corsConfig = config.env === "development" ? { ...corsOptions, origin: true } : corsOptions;
app.use(cors(corsConfig));

/* -------------------------------------------------------------------------- */
/*                               ROOT ENDPOINTS                               */
/* -------------------------------------------------------------------------- */
app.get("/", (req, res, next) => {
    return res.status(200).send({
        status: "success",
        message: "🚀 API is running successfully!",
        docs: "/api/docs",
    });
});
app.get("/health", (req, res) => {
    return res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: config.env
    });
});

/* --------------------------------- Routes --------------------------------- */
// API Routes
app.use("/api", Routes);
app.use((req, res, next) => {
    setupLogger("server");
    logger.info(`${req.method} ${req.originalUrl}`, { ip: req.ip, userAgent: req.get("User-Agent") }, "\n\n");
    next();
});

/* ----------------------------- ERROR HANDLING ----------------------------- */
// Global error handler
app.use((err, req, res, next) => {
    setupLogger("server");
    if (!err.statusCode) err.statusCode = 500; // Ensure statusCode exists
    logger.error(`Error: ${err.message}\n${err.stack}`);

    // Handle JWT errors
    if (err.name === "JsonWebTokenError") return res.status(401).json({ status: "error", message: "Invalid token. Please log in again!" });

    // Handle validation errors
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ status: "error", message: `Validation error: ${messages.join(". ")}` });
    };

    // Handle other errors
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: "error",
        message: err.message || "Internal Server Error",
        ...(config.env === "development" && { stack: err.stack })
    });
});

/* ------------------------------ START SERVER ------------------------------ */
app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port} in ${config.env} mode`);
    console.log(`📄 API Documentation: http://localhost:${port}/api/docs`);
});

/* ---------------------------- UNCAUGHT HANDLERS --------------------------- */
process.on("unhandledRejection", (error) => {
    setupLogger("server");
    logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
    logger.error(error.name, error.message, "\n\n");
    process.exit(1);
});

process.on("uncaughtException", (error) => {
    setupLogger("server");
    logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    logger.error(error.name, error.message, "\n\n");
    process.exit(1);
});