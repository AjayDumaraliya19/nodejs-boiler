// ./src/configs/config.js

require("dotenv").config();
const Joi = require("joi");

/* -------------------------------------------------------------------------- */
/*                    .ENV ENVIRONMENT VARIABLE VALIDATION                    */
/* -------------------------------------------------------------------------- */
/**
 * @typedef {Object} EnvVarsSchema
 * @property {string} NODE_ENV - The environment mode (development or production)
 * @property {number} PORT - The port number for the server
 * @property {string} REQUEST_BODY_LIMIT - The maximum size of the request body
 * @property {string} MONGODB_URL - The MongoDB connection URL
 * @property {string} MONGODB_DB - The MongoDB database name
 * @property {string} JWT_SECRET - The JWT secret key
 * @property {string} JWT_EXPIRES_IN - The JWT expiration time
 * @property {number} JWT_COOKIE_EXPIRES_IN - The JWT cookie expiration time
 * @property {string} CORS_ORIGIN - The allowed origin for CORS
 * @property {number} RATE_LIMIT_WINDOW_MS - The rate limit window in milliseconds
 * @property {number} RATE_LIMIT_MAX - The maximum number of requests allowed
 * @property {string} EMAIL_PASS - The email password
 * @property {string} SENDER_USER - The sender user
 */
const envVarsSchema = Joi.object({
    NODE_ENV: Joi.string().trim().valid("development", "production").required(),
    PORT: Joi.number().integer().default(8080).required(),
    REQUEST_BODY_LIMIT: Joi.string().trim().optional(),

    MONGODB_URL: Joi.string().trim().required(),
    MONGODB_DB: Joi.string().trim().required(),

    JWT_SECRET: Joi.string().trim().required(),
    JWT_EXPIRES_IN: Joi.string().trim().required(),
    JWT_COOKIE_EXPIRES_IN: Joi.number().integer().required(),

    CORS_ORIGIN: Joi.string().trim().required(),

    RATE_LIMIT_WINDOW_MS: Joi.number().integer().required(),
    RATE_LIMIT_MAX: Joi.number().integer().required(),

    EMAIL_PASS: Joi.string().trim().required(),
    SENDER_USER: Joi.string().trim().required()
}).unknown();

/* -------------------------------------------------------------------------- */
/*                        VALIDATE AND LOAD ENV CONFIG                        */
/* -------------------------------------------------------------------------- */
/**
 * @type {EnvVarsSchema}
 * @description Validate and load environment variables
 * @returns {EnvVarsSchema}
 * @throws {Error}
 */
const { error, value: envVars } = envVarsSchema.prefs({ errors: { label: "key" } }).validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

/* -------------------------------------------------------------------------- */
/*                               EXPORT SETTINGS                              */
/* -------------------------------------------------------------------------- */
/**
 * @type {EnvVarsSchema}
 * @description Export environment variables
 * @returns {EnvVarsSchema}
 */
exports.config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    limit: envVars.REQUEST_BODY_LIMIT,
    mongo: {
        url: envVars.MONGODB_URL,
        db: envVars.MONGODB_DB,
    },
    jwt: {
        secret: envVars.JWT_SECRET,
        expires: envVars.JWT_EXPIRES,
        cookie: envVars.JWT_COOKIE_EXPIRES_IN
    },
    cors: {
        origin: envVars.CORS_ORIGIN,
    },
    "rate-limit": {
        window_ms: envVars.RATE_LIMIT_WINDOW_MS,
        max: envVars.RATE_LIMIT_MAX
    },
    email: {
        pass: envVars.EMAIL_PASS,
        sender: envVars.SENDER_USER
    }
}