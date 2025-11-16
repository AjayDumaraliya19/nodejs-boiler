// ./src/db/connectionDB.js

const { Pool } = require("pg");
const { config } = require("../configs/envConfig.js");
const { setupLogger, logger } = require("../helpers/logger.js");

// Track the current client for transactions
const clientConfig = config.sql;
const pool = new Pool({
  host: clientConfig.host,
  port: clientConfig.port,
  user: clientConfig.user,
  database: clientConfig.db,
  password: clientConfig.password,
  max: clientConfig.max,
  idleTimeoutMillis: clientConfig.idletime,
  connectionTimeoutMillis: clientConfig.conntime,
});

/* -------------------------------------------------------------------------- */
/*                      DATABASE CONNECITON TEST FUNCTION                     */
/* -------------------------------------------------------------------------- */
/**
 * Test the database connection
 * @returns {Promise<void>}
 */
const testDBConnection = async () => {
  const client = await pool.connect();
  try {
    await client.query("SELECT NOW()");
    logger.info("Successfully connected to PostgreSQL database");
  } catch (error) {
    logger.error(
      `PostgreSQL database connection test failed: ${error.message}`,
    );
    throw error;
  } finally {
    client.release();
  }
};

/* -------------------------------------------------------------------------- */
/*                        DATABASE CONNECITON FUNCITON                        */
/* -------------------------------------------------------------------------- */
/**
 * Established a connection to the PostgreSQL database
 * @returns {Promise<import("pg").Pool>} - Connection PostgreSQL client instance
 * @throws {Error} If connection to the database fails
 */
const connectDB = async () => {
  setupLogger("database");
  try {
    await testDBConnection();
    return pool;
  } catch (error) {
    console.log("PostgreSQL connection failed:", error?.message);
    logger.error(`PostgreSQL connection failed: ${error?.message}`);
    process.exit(1);
  }
};

/* -------------------------------------------------------------------------- */
/*                          GRACEFUL SHUTDOWN HANDLER                         */
/* -------------------------------------------------------------------------- */
/**
 * Gracefully closes the database connection
 * @returns {Promise<void>}
 */
const closeDB = async () => {
  setupLogger("database");
  try {
    console.log("Closing PostgreSQL connection pool...");
    if (pool) {
      await pool.end();
      logger.info(`PostgreSQL connection pool closed`);
    }
  } catch (error) {
    console.log("Error closing PostgreSQL connection pool:", error?.message);
    logger.error(
      `Error closing ProstgreSQL connection pool: ${error?.message}`,
    );
    throw error;
  }
};

// Handle connection errors
pool.on("error", (err) => {
  logger.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(-1);
});

/* ---------------------------- EXPORT FUNCTIONS ---------------------------- */
module.exports = {
  connectDB,
  closeDB,
  pool,
};
