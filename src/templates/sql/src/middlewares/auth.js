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

// Promisify JWT verify function
const verifyJwt = promisify(jwt.verify);

/* -------------------------------------------------------------------------- */
/*                               Sign JWT token                               */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Sign JWT token
 * @param {string} id - The user id
 * @returns {string} The signed token
 */
exports.createToken = (data) => {
  return jwt.sign({ data }, config.jwt.secret, {
    expiresIn: config.jwt.expires || "90d",
  });
};

/* -------------------------------------------------------------------------- */
/*                                Protect Routes                              */
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
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }
    if (!token) {
      logger.warn("Unauthorized: Missing JWT token in request.");
      return unauthorized(res, "Access denied. Please log in to continue.");
    }

    // Verify token
    const decoded = await verifyJwt(token, config.jwt.secret);
    if (!decoded?.data) {
      logger.error("Invalid or malformed JWT token:", JSON.stringify(decoded));
      return unauthorized(res, "Invalid session. Please log in again.");
    }
    const data = decoded?.data;

    // Validate user existence
    const currentUser = await User.findData({ id: data?.id });
    if (!currentUser) {
      logger.warn(
        `Unauthorized: Token belongs to a deleted or inactive user (ID: ${data?.id}).`,
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
        `User (ID: ${data?.id}) recently changed password. Token invalidated.`,
      );
      return unauthorized(
        res,
        "Your password was recently changed. Please log in again.",
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = User.sanitize(currentUser);
    res.locals.user = currentUser;

    logger.info(`Access granted to user ID: ${data?.id}`);
    next();
  } catch (error) {
    console.log("Authentication Error:", error?.message || "");
    logger.error(
      "Error during Authentication: ",
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
/*                             Restrict To Roles                              */
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

/* -------------------------------------------------------------------------- */
/*                          Check User Login Status                           */
/* -------------------------------------------------------------------------- */
/**
 * Middleware to check if user is logged in (for frontend use)
 */
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies?.jwt) {
      // Verify token
      const decoded = await verifyJwt(req.cookies.jwt, config.jwt.secret);

      // Check if user still exists
      const currentUser = await User.findData({ id: decoded.id });
      if (!currentUser) {
        return next();
      }

      // Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
    }

    next();
  } catch (error) {
    next();
  }
};
