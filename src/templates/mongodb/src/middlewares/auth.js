// ./src/middlewares/auth.js

const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");
const { config } = require("../configs/envConfig.js");
const { promisify } = require("util");
const {
  setupLogger,
  logger,
  logRequestDetails,
} = require("../helpers/logger.js");
const {
  unauthorized,
  forbidden,
  serverError,
} = require("../utils/responses.js");

/* -------------------------------------------------------------------------- */
/*                               Sign JWT token                               */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Sign JWT token
 * @param {string} id - The user id
 * @returns {string} The signed token
 */
exports.createToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expires || "90d",
  });
};

/* -------------------------------------------------------------------------- */
/*                        Middleware to protect routes                        */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Middleware to protect routes - verifies JWT and attaches user to request
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 */
exports.protect = async (req, res, next) => {
  setupLogger("authentication");
  try {
    // Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    if (!token) {
      logger.warn("Unauthorized: Missing JWT token in request.");
      return unauthorized(res, "Access denied. Please log in to continue.");
    }

    // Verification token
    let decoded;
    try {
      decoded = await promisify(jwt.verify)(token, config.jwt.secret);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return unauthorized(
          res,
          "Your token has expired! Please log in again.",
        );
      } else if (err.name === "JsonWebTokenError") {
        return unauthorized(res, "Invalid token! Please log in again.");
      } else if (err.name === "NotBeforeError") {
        return unauthorized(
          res,
          "Token not active yet! Please try again later.",
        );
      } else {
        logger.error("JWT Verification Error:", err);
        return serverError(res, "Error verifying authentication token.", err);
      }
    }

    // Validate user existence
    const currentUser = await User.findById(decoded.id).select(
      "+passwordChangedAt",
    );
    if (!currentUser) {
      logger.warn(
        `Unauthorized: Token belongs to a deleted or inactive user (ID: ${decoded?.id}).`,
      );
      return unauthorized(
        res,
        "User no longer exists. Please sign up or contact support.",
      );
    }

    // Check if password changed after JWT was issued
    const changedPassword = currentUser.changedPasswordAfter(decoded.iat);
    if (changedPassword) {
      logger.info(
        `User (ID: ${decoded?.id}) recently changed password. Token invalidated.`,
      );
      return unauthorized(
        res,
        "Your password was recently changed. Please log in again.",
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;

    logger.info(`Access granted to user ID: ${decoded?.id}`);
    next();
  } catch (error) {
    console.log("Authentication Error:", error?.message || "");
    logger.error(
      "Error occured Authentication: ",
      JSON.stringify({ message: error?.message || "", stack: error?.stack }),
    );
    return serverError(
      res,
      "Something went wrong while verifying your session. Please try again later.",
      error,
    );
  } finally {
    logRequestDetails(req);
  }
};

/* -------------------------------------------------------------------------- */
/*               Middleware to restrict routes to certain roles               */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Middleware to restrict routes to certain roles
 * @param {Array} roles - The roles to restrict to
 * @returns {Function} The middleware function
 */
exports.restrictTo = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return forbidden(
        res,
        "You do not have permission to perform this action",
      );
    next();
  };
};
