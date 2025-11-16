// ./src/controllers/user.controller.js

const User = require("../models/user.model.js");
const { createToken } = require("../middlewares/auth.js");
const { sendMail, generateEmailMessage } = require("../helpers/mail.js");
const {
  setupLogger,
  logger,
  logRequestDetails,
} = require("../helpers/logger.js");
const {
  conflict,
  success,
  serverError,
  notFound,
  unauthorized,
  paginated,
  created,
  badRequest,
} = require("../utils/responses.js");

const logfile_folder = "user_controller";

/* -------------------------------------------------------------------------- */
/*                        USER PUBLIC ROUTES CONTROLLER                       */
/* -------------------------------------------------------------------------- */
//#region Public Routes Controllers
/**
 * @type {Function}
 * @description Register a new user and issue a JWT token
 * @route   POST /user/register
 * @desc    Register a new user and issue a JWT token
 * @access  Public
 * @body    { name, email, password, passwordConfirm }
 * @returns {Object}
 * @throws {Error}
 */
exports.register = async (req, res) => {
  setupLogger(`${logfile_folder}/register`);
  try {
    // Request Validation
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      logger.warn(
        `BadRequest: Missing required fields --> ${JSON.stringify(req.body)}`,
      );
      return badRequest(res, "Name, email, and password are required.");
    }

    // Check for duplicate email
    const emailExist = await User.findByEmail({ email });
    if (emailExist) {
      logger.warn(
        `Conflict: Email already exists --> ${JSON.stringify(emailExist)}`,
      );
      return conflict(res, `User already exists with this email "${email}"`);
    }

    // Create new User
    const newUser = await User.create({ name, email, password });
    if (!newUser) {
      logger.error(
        `BadRequest: Failed to create user --> ${JSON.stringify({ name, email, password })}`,
      );
      return badRequest(res, `Failed to create user. Please check your input.`);
    }

    // Create Token
    const token = createToken({ id: newUser.id, role: newUser.role });
    if (!token) {
      logger.error(
        `Failed to create JWT token for user: ${newUser.id}. Deleting user.`,
      );

      // If token creation fails, remove user and log error
      await User.delete(newUser.id);
      return badRequest(
        res,
        "Failed to generate authentication token. Please try again later.",
      );
    }

    // Success Response
    return created(
      res,
      { token, user: newUser },
      "User registered successfully",
    );
  } catch (error) {
    console.log("Register Error:", error?.message || "");
    logger.error(
      "Error during registration: ",
      JSON.stringify({ message: error?.message || "", stack: error?.stack }),
    );
    return serverError(
      res,
      "Internal server error occurred while registration.",
      error,
    );
  } finally {
    logRequestDetails(req);
  }
};

/**
 * @type {Function}
 * @description Authenticate a user and issue a JWT token
 * @route   POST /user/login
 * @desc    Authenticate a user and issue a JWT token
 * @access  Public
 * @body    { email, password }
 * @returns {Object}
 * @throws {Error}
 */
exports.login = async (req, res) => {
  setupLogger(`${logfile_folder}/login`);
  try {
    // Validate input
    const { email, password } = req.body;
    if (!email || !password) {
      logger.warn(
        `BadRequest: Missing required fields --> ${JSON.stringify(req.body)}`,
      );
      return badRequest(res, "Email and password are required.");
    }

    // Find user by email and Compare password
    const user = await User.findByEmail({ email, password });
    if (!user) {
      logger.warn(`Unauthorized: Incorrect credentials for "${email}"`);
      return unauthorized(
        res,
        "Incorrect email or password. Please try again.",
      );
    }

    // Generate JWT token
    const token = createToken({ id: user?.id, role: user?.role });
    if (!token) {
      logger.error(
        `ServerError: Failed to create JWT token for user ID: ${user.id}`,
      );
      return badRequest(
        res,
        "Failed to generate authentication token. Please try again later.",
      );
    }

    // Success Response
    return success(
      res,
      { token, user: User.sanitize(user) },
      "Logged in successfully",
    );
  } catch (error) {
    console.log("Login Error:", error?.message || "");
    logger.error(
      "Error during login: ",
      JSON.stringify({ message: error?.message || "", stack: error?.stack }),
    );
    return serverError(
      res,
      "Internal server error occured while login.",
      error,
    );
  } finally {
    logRequestDetails(req);
  }
};

/**
 * @type {Function}
 * @description Forgot password
 * @route   POST /user/forgot-password
 * @desc    Forgot password
 * @access  Public
 * @body    { email }
 * @returns {Object}
 * @throws {Error}
 */
exports.forgot_password = async (req, res) => {
  setupLogger(`${logfile_folder}/forgot_password`);
  try {
    // Validate input
    const { email } = req.body;
    if (!email) {
      logger.warn(
        `BadRequest: Missing email field --> ${JSON.stringify(req.body)}`,
      );
      return badRequest(res, "Email is required.");
    }

    // Find user based on email
    const user = await User.findByEmail({ email });
    if (!user) {
      logger.warn(`NotFound: User with email "${email}" not found.`);
      return notFound(res, "No user found with this email address.");
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    if (!resetToken) {
      logger.error(
        `ServerError: Failed to create password reset token for user ID: ${user.id}`,
      );
      return serverError(
        res,
        "Failed to generate password reset token. Please try again later.",
      );
    }

    // Save token and expiry in DB
    const updatedUser = await user.save();
    if (!updatedUser) {
      logger.error(
        `ServerError: Failed to update user after token generation for email: "${email}"`,
      );
      return serverError(
        res,
        "Failed to update user record. Please try again later.",
      );
    }

    // Send resetToken to user's email
    try {
      await sendMail({
        to: user.email,
        subject: "Reset your Password",
        html: generateEmailMessage(
          "Password Reset Request",
          "We received a request to reset your password. Use the TOKEN below to reset your password:",
          user?.name || "User",
          resetToken,
        ),
      });

      logger.info(
        `Password reset token sent successfully to email: "${email}"`,
      );

      // Success Response
      return success(res, null, "Reset token sent to email!");
    } catch (mailError) {
      // Rollback token fields if email sending fails
      user.password_reset_token = undefined;
      user.password_reset_expires = undefined;

      await user.save();

      // Error Response
      logger.error(
        "Error while sending reset email: ",
        JSON.stringify({
          message: mailError?.message || "",
          stack: mailError?.stack,
        }),
      );
      return serverError(
        res,
        "Error sending reset email. Please try again later.",
        mailError,
      );
    }
  } catch (error) {
    console.log("Error during forgot password process:", error?.message || "");
    logger.error(
      "Error during forgot password process: ",
      JSON.stringify({ message: error?.message || "", stack: error?.stack }),
    );
    return serverError(
      res,
      "Internal server error occured while forgot password.",
      error,
    );
  } finally {
    logRequestDetails(req);
  }
};

/**
 * @type {Function}
 * @description Reset password
 * @route   PATCH /user/reset-password?token
 * @access  Public
 * @body    { password, passwordConfirm }
 * @returns {Object}
 * @throws {Error}
 */
exports.reset_password = async (req, res) => {
  setupLogger(`${logfile_folder}/reset-password`);
  try {
    // Validate inputs
    const { token } = req.query;
    const { password } = req.body;
    if (!token || !password) {
      const missingField = !token ? "Reset token" : "Password";
      logger.warn(`BadRequest: Missing ${missingField}.`);
      return badRequest(res, `${missingField} is required.`);
    }

    // Find user by valid token and update password
    const user = await User.findByToken({ token, newPassword: password });
    if (!user) {
      logger.warn(`NotFound: Invalid or expired reset token.`);
      return notFound(res, "Token is invalid or has expired.");
    }

    // Generate new JWT token after password reset
    const authToken = createToken({ id: user.id, role: user.role });
    if (!authToken) {
      logger.error(
        `ServerError: Failed to create JWT token for user ID: ${user.id}`,
      );
      return serverError(
        res,
        "Password reset completed, but failed to generate auth token.",
      );
    }

    // Success response
    return success(
      res,
      { token: authToken, user },
      "Password reset successful",
    );
  } catch (error) {
    console.log("Error during password reset:", error?.message || "");
    logger.error(
      "Error during reset password: ",
      JSON.stringify({ message: error?.message || "", stack: error?.stack }),
    );
    return serverError(
      res,
      "Internal server error occured while reset password.",
      error,
    );
  } finally {
    logRequestDetails(req);
  }
};
//#endregion

/* -------------------------------------------------------------------------- */
/*                    USER AUTHENTICATED ROUTES CONTROLLERS                   */
/* -------------------------------------------------------------------------- */
//#region User authentication Routes Controllers
/**
 * @type {Function}
 * @description Get current logged in user
 * @route   GET /user/me
 * @access  Private
 * @returns {Object}
 * @throws {Error}
 */
exports.get_me = async (req, res) => {
  setupLogger(`${logfile_folder}/me`);
  try {
    const user = await User.findData({ id: req.user.id });

    return success(res, user, "User profile retrieved successfully");
  } catch (error) {
    console.log("Getting me Error:", error?.message || "");
    logger.error(
      `Error occured while retrieving user data: `,
      JSON.stringify({ message: error?.message || "", stack: error?.stack }),
    );
    return serverError(
      res,
      "Internal server error occured while retrieving user data.",
      error,
    );
  } finally {
    logRequestDetails(req);
  }
};

/**
 * @type {Function}
 * @description Update user details
 * @route   PATCH /user/update-me
 * @access  Private
 * @body    { name, email }
 * @returns {Object}
 * @throws {Error}
 */
exports.update_me = async (req, res) => {
  setupLogger(`${logfile_folder}/update-me`);
  try {
    const { name, email } = req.body;
    if (!name && !email) {
      logger.warn("BadRequest: No fields provided for update.");
      return badRequest(
        res,
        "Please provide at least one field to update (name or email).",
      );
    }

    // Fetch user by token-authenticated ID
    const user = await User.findData({ id: req.user.id });
    if (!user) {
      logger.warn("Unauthorized: Token is invalid or has expired.");
      return unauthorized(
        res,
        "Your session has expired or token is invalid.\nPlease log in again.",
      );
    }

    // Check if new email already exists for another user
    if (email) {
      const checkEmail = await User.findData(
        `id <> ${req.user.id} AND email ILIKE '${email}'`,
      );
      if (checkEmail) {
        logger.warn(`Conflict: Email already in use -> ${email}`);
        return conflict(
          res,
          `The email "${email}" is already registered with another account.`,
        );
      }
    }

    // Update only provided fields
    if (name) user.name = name;
    if (email) user.email = email;

    // Save updated user data
    const updateData = await user.save();
    if (!updateData) {
      logger.error(`Failed to update user: ${JSON.stringify(user)}.`);
      return serverError(
        res,
        "Something went wrong while updating your profile.\nPlease try again later.",
      );
    }

    // Success response
    return success(res, user, "Your profile has been updated successfully.");
  } catch (error) {
    console.log("Update me Error:", error?.message || "");
    logger.error(
      "Error during updating me: ",
      JSON.stringify({ message: error?.message || "", stack: error?.stack }),
    );
    return serverError(
      res,
      "Internal server error occurred while updating your profile.",
      error,
    );
  } finally {
    logRequestDetails(req);
  }
};

/**
 * @type {Function}
 * @description Update user password
 * @route   PATCH /user/update-password
 * @access  Private
 * @body    { password, newPassword, newPasswordConfirm }
 * @returns {Object}
 * @throws {Error}
 */
exports.update_password = async (req, res) => {
  setupLogger(`${logfile_folder}/update-password`);
  try {
    // Validate input fields
    const { password, newPassword } = req.body;
    if (!password || !newPassword) {
      logger.warn("BadRequest: Missing current or new password.");
      return badRequest(res, "Both current and new passwords are required.");
    }

    // Fetch current user
    const user = await User.findData({ id: req.user.id });
    if (!user) {
      logger.warn("Unauthorized: Token is invalid or has expired.");
      return unauthorized(
        res,
        "Your session has expired or token is invalid.\nPlease log in again.",
      );
    }

    // Check old password validity
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn(`Incorrect current password entered for user ID: ${user.id}`);
      return unauthorized(
        res,
        "Your current password is incorrect. Please try again.",
      );
    }

    // Prevent same password reuse
    if (password === newPassword) {
      logger.warn(`User ID: ${user.id} attempted to reuse the same password.`);
      return badRequest(
        res,
        "Your new password cannot be the same as the old one.",
      );
    }

    // Store old password in case rollback is needed
    const oldPassword = user.password;

    // Update password
    const updated = await user.updatePassword(newPassword);
    if (!updated) {
      logger.error(`Failed to update password for user ID: ${user.id}`);
      return serverError(
        res,
        "Something went wrong while updating your password.\nPlease try again later.",
      );
    }

    // Generate new JWT token after password update
    const token = createToken({ id: user.id, role: user.role });
    if (!token) {
      logger.error(`JWT token generation failed for user: ${user.id}`);

      // Rollback password update
      user.password = oldPassword;
      await user.save();

      return serverError(
        res,
        "Failed to generate authentication token. Please try again later.",
      );
    }

    // Success Response
    return success(
      res,
      { token, user },
      "Your password has been updated successfully",
    );
  } catch (error) {
    console.log("Updating password Error:", error?.message || "");
    logger.error(
      "Error during updating password: ",
      JSON.stringify({ message: error?.message || "", stack: error?.stack }),
    );
    return serverError(
      res,
      "Internal server error occurred while updating password.",
      error,
    );
  } finally {
    logRequestDetails(req);
  }
};
//#endregion

/* -------------------------------------------------------------------------- */
/*                    ADMIN AUTHENTICATE ROUTES CONTROLLERS                   */
/* -------------------------------------------------------------------------- */
//#region Admin Restrict Routes Controllers
/**
 * @type {Function}
 * @description Get all users
 * @route   GET admin/users
 * @access  Private/Admin
 * @returns {Object}
 * @throws {Error}
 */
exports.user_list = async (req, res) => {
  setupLogger(`${logfile_folder}/user_list`);
  try {
    const users = await User.findAllData(
      { role: "user" },
      "id, name, email, role, active",
    );
    return success(res, users, "Users retrieved successfully");
  } catch (error) {
    console.log("Error user list:", error?.message || "");
    logger.error(
      "Error during user list: ",
      JSON.stringify({ message: error?.message || "", stack: error?.stack }),
    );
    return serverError(
      res,
      "Internal server error occured while retrieving user list.",
      error,
    );
  } finally {
    logRequestDetails(req);
  }
};

/**
 * @type {Function}
 * @description Get all users with pagination
 * @route   GET admin/user/pagelist
 * @access  Private/Admin
 * @query   {number} [page=1] Page number
 * @query   {number} [limit=10] Number of items per page (1-100)
 * @query   {string} [search] Search term to filter users by name or email
 * @returns {Object} Paginated list of users
 * @throws {Error}
 */
exports.user_list_pagination = async (req, res) => {
  setupLogger(`${logfile_folder}/user_list_pagination`);
  try {
    // Get and validate query parameters
    let { page = 1, limit = 10, search } = req.query;

    // Validate and sanitize pagination parameters
    page = Number(page);
    limit = Number(limit);
    if (isNaN(page) || page < 1) {
      logger.warn(`BadRequest: Invalid page number (${req.query.page})`);
      return badRequest(
        res,
        "Invalid page number. Page must be a positive integer.",
      );
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      logger.warn(`BadRequest: Invalid limit (${req.query.limit})`);
      return badRequest(res, "Invalid limit. Limit must be between 1 and 100.");
    }

    // Get paginated data
    const result = await User.findDataWithPagination(
      "active AND role = 'user'",
      `id, name, email, role, active, created_at`,
      page,
      limit,
      search,
      ["name", "email"],
      "created_at DESC",
    );

    const data = result?.data || [];
    const totalUsers = result?.total || 0;

    // Sucess message
    return paginated(
      res,
      data,
      totalUsers,
      page,
      limit,
      "Users retrieved successfully",
    );
  } catch (error) {
    console.log("Error user pagelist:", error?.message || "");
    logger.error(
      "Error during user pagelist: ",
      JSON.stringify({ message: error?.message || "", stack: error?.stack }),
    );
    return serverError(
      res,
      "Internal server error occured while retrieving users.",
      error,
    );
  } finally {
    logRequestDetails(req);
  }
};

/**
 * @type {Function}
 * @description Get single users
 * @route   GET admin/user
 * @access  Private/Admin
 * @returns {Object}
 * @throws {Error}
 */
exports.get_user = async (req, res) => {
  setupLogger(`${logfile_folder}/get_user`);
  try {
    // Validate input
    const { id } = req.query;
    if (!id || isNaN(id)) {
      logger.warn(`BadRequest: Invalid or missing user ID (${id})`);
      return badRequest(res, "A valid user ID is required.");
    }

    // Fetch user from database
    const user = await User.findData({ id: Number(id) });
    if (!user) {
      logger.warn(`NotFound: No user found with ID ${id}`);
      return notFound(res, `No user found with ID ${id}.`);
    }

    // Success Response
    return success(res, user, "User retrieved successfully");
  } catch (error) {
    console.log("Get user Error:", error?.message || "");
    logger.error(
      "Error during get users ",
      JSON.stringify({ message: error?.message || "", stack: error?.stack }),
    );
    return serverError(
      res,
      "Internal server error while retrieving user.",
      error,
    );
  } finally {
    logRequestDetails(req);
  }
};

/**
 * @type {Function}
 * @description Deactivate user (soft delete)
 * @route   Patch admin/user
 * @access  Private/Admin
 * @body    { id, status }
 * @returns {Object}
 * @throws {Error}
 */
exports.update_user = async (req, res) => {
  setupLogger(`${logfile_folder}/update_user`);
  try {
    // Validate ID
    const { id, active } = req.query;
    if (!id || isNaN(id)) {
      logger.warn(`BadRequest: Invalid or missing user ID (${id})`);
      return badRequest(res, "A valid user ID is required.");
    }

    // Validate update fields
    if (typeof active === "undefined") {
      logger.warn(`BadRequest: Missing 'active' status in request body.`);
      return badRequest(
        res,
        "The 'active' field is required to update the user.",
      );
    }

    const activeValue =
      active === "true" ? true : active === "false" ? false : null;
    if (activeValue === null) {
      logger.warn(`BadRequest: Invalid active value '${active}'.`);
      return badRequest(
        res,
        "The 'active' query parameter must be either true or false.",
      );
    }

    // Find user by ID
    const user = await User.findData({ id: Number(id) });
    if (!user) {
      logger.warn(`NotFound: No user found with ID: ${id}`);
      return notFound(res, `No user found with ID: ${id}.`);
    }

    // Update user details
    user.active = active;

    const updatedUser = await user.save();
    if (!updatedUser) {
      logger.error(`ServerError: Failed to update user with ID: ${id}`);
      return serverError(res, "Failed to update user. Please try again later.");
    }

    // Success response
    return success(res, updatedUser, "User status updated successfully.");
  } catch (error) {
    console.log("Update user by id Error:", error?.message || "");
    logger.error(
      "Error during update user by id: ",
      JSON.stringify({ message: error?.message || "", stack: error?.stack }),
    );
    return serverError(
      res,
      "Internal server error while updating user status.",
      error,
    );
  } finally {
    logRequestDetails(req);
  }
};

/**
 * @type {Function}
 * @description Delete user
 * @route   Delete admin/user
 * @access  Private/Admin
 * @body    { id }
 * @returns {Object}
 * @throws {Error}
 */
exports.delete_user = async (req, res) => {
  setupLogger(`${logfile_folder}/delete_user`);
  try {
    // Validate ID
    const { id } = req.query;
    if (!id || isNaN(id)) {
      logger.warn(`BadRequest: Invalid or missing user ID (${id})`);
      return badRequest(res, "A valid numeric user ID is required.");
    }

    // Find user
    const user = await User.findData({ id: Number(id) });
    if (!user) {
      logger.warn(`NotFound: No user found with ID: ${id}`);
      return notFound(res, `No user found with ID: ${id}.`);
    }

    // Delete user
    const deleted = await User.delete(Number(id));
    if (!deleted) {
      logger.error(`ServerError: Failed to delete user with ID: ${id}`);
      return serverError(res, "Failed to delete user. Please try again later.");
    }

    // Success Response
    return success(res, null, "User deleted successfully.");
  } catch (error) {
    console.log("Error occured while deleting:", error?.message || "");
    logger.error(
      "Error occured while deleting:",
      JSON.stringify({ message: error?.message || "", stack: error?.stack }),
    );
    return serverError(
      res,
      "Internal server error occured while deleting user.",
      error,
    );
  } finally {
    logRequestDetails(req);
  }
};
//#endregion
