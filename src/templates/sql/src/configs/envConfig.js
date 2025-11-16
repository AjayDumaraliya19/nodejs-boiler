// ./src/configs/envConfig.js

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
 * @property {string} CONNECTION_HOST - The Postgres connection host
 * @property {number} CONNECTION_PORT - The Postgres connection port
 * @property {string} CONNECTION_USER - The Postgres connection user
 * @property {string} CONNECTION_DB - The Postgres database name
 * @property {string} CONNECTION_PASSWORD - The Postgres connection password
 * @property {number} CONNECTION_MAX - The maximum number of DB connections
 * @property {number} CONNECTION_IDLE_TIMEOUT - Idle connection timeout in ms
 * @property {number} CONNECTION_CONN_TIMEOUT - Connection timeout in ms
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

  CONNECTION_HOST: Joi.string().trim().required(),
  CONNECTION_PORT: Joi.number().integer().required(),
  CONNECTION_USER: Joi.string().trim().required(),
  CONNECTION_DB: Joi.string().trim().required(),
  CONNECTION_PASSWORD: Joi.string().trim().required(),
  CONNECTION_MAX: Joi.number().integer().required(),
  CONNECTION_IDEL_ITMEOUT: Joi.number().integer().required(),
  CONNECTION_CONN_TIMEOUT: Joi.number().integer().required(),

  JWT_SECRET: Joi.string().trim().required(),
  JWT_EXPIRES_IN: Joi.string().trim().required(),
  JWT_COOKIE_EXPIRES_IN: Joi.number().integer().required(),

  CORS_ORIGIN: Joi.string().trim().required(),

  RATE_LIMIT_WINDOW_MS: Joi.number().integer().required(),
  RATE_LIMIT_MAX: Joi.number().integer().required(),

  EMAIL_PASS: Joi.string().trim().required(),
  SENDER_USER: Joi.string().trim().required(),
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
const { error, value: envVars } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);
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
  sql: {
    host: envVars.CONNECTION_HOST,
    port: envVars.CONNECTION_PORT,
    user: envVars.CONNECTION_USER,
    db: envVars.CONNECTION_DB,
    password: envVars.CONNECTION_PASSWORD,
    max: envVars.CONNECTION_MAX,
    idletime: envVars.CONNECTION_IDEL_ITMEOUT,
    conntime: envVars.CONNECTION_CONN_TIMEOUT,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expires: envVars.JWT_EXPIRES_IN,
    cookie: envVars.JWT_COOKIE_EXPIRES_IN,
  },
  cors: {
    origin: envVars.CORS_ORIGIN,
  },
  "rate-limit": {
    window_ms: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX,
  },
  email: {
    pass: envVars.EMAIL_PASS,
    sender: envVars.SENDER_USER,
  },
};
