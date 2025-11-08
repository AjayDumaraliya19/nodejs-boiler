// ./src/middlewares/auth.js

const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");
const { config } = require("../configs/envConfig.js");
const { promisify } = require("util");
const {
    notFound,
    unauthorized,
    forbidden,
    serverError } = require("../utils/responses.js");
const {
    setupLogger,
    logger,
    logRequestDetails } = require("../helpers/logger.js");

/* -------------------------------------------------------------------------- */
/*                               Sign JWT token                               */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Sign JWT token
 * @param {string} id - The user id
 * @returns {string} The signed token
 */
const signToken = (id) => {
    return jwt.sign(
        { id },
        config.jwt.secret,
        { expiresIn: config.jwt.expires || "90d" }
    );
};

/* -------------------------------------------------------------------------- */
/*                          Create and send JWT token                         */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Create and send JWT token
 * @param {string} id - The user id
 * @returns {string} The signed token
 */
exports.createToken = (id) => {
    const token = signToken(id);
    // const cookieOptions = {
    //     expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000),
    //     httpOnly: true,
    //     secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    //     sameSite: "strict",
    // };

    return token;
};

/* -------------------------------------------------------------------------- */
/*                        Middleware to protect routes                        */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Middleware to protect routes
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 */
exports.protect = async (req, res, next) => {
    setupLogger("authentication");
    try {
        // Getting token and check if it's there -----
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies.jwt) {
            token = req.cookies.jwt;
        }
        if (!token) return notFound(res, "You are not logged in!\nPlease log in to get access.");

        // Verification token -----
        let decoded;
        try {
            decoded = await promisify(jwt.verify)(token, config.jwt.secret);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return unauthorized(res, "Your token has expired! Please log in again.");
            } else if (err.name === "JsonWebTokenError") {
                return unauthorized(res, "Invalid token! Please log in again.");
            } else if (err.name === "NotBeforeError") {
                return unauthorized(res, "Token not active yet! Please try again later.");
            } else {
                logger.error("JWT Verification Error:", err);
                return serverError(res, "Error verifying authentication token.", err);
            }
        };

        // Check if user still exists -----
        const currentUser = await User.findById(decoded.id).select("+passwordChangedAt");
        if (!currentUser) return unauthorized(res, "The user belonging to this token no longer exists.");

        // Check if user changed password after the token was issued -----
        const changedPassword = currentUser.changedPasswordAfter(decoded.iat);
        if (changedPassword) return unauthorized(res, "User recently changed password! Please log in again.");

        // GRANT ACCESS TO PROTECTED ROUTE -----
        req.user = currentUser;
        res.locals.user = currentUser;

        next();
    } catch (error) {
        console.log("Authentication Error:", error?.message || "");
        logger.error("Error during Authentication: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
        return serverError(res, "Internal server error during Authentication.", error);
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
        if (!roles.includes(req.user.role)) return forbidden(res, "You do not have permission to perform this action");
        next();
    };
};
