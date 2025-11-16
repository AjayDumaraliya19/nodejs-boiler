// ./src/controllers/user.controller.js

const User = require("../models/user.model.js");
const crypto = require("crypto");
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
  badRequest,
} = require("../utils/responses.js");

const logfile_folder = "user_controller"; // Common logger Folder Name

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
    const emailExist = await User.exists({ email });
    if (emailExist) {
      logger.warn(
        `Conflict: Email already exists --> ${JSON.stringify(emailExist)}`,
      );
      return conflict(res, `User already exists with this email "${email}"`);
    }

    // Create New User
    const newUser = await User.create({ name, email, password });
    logger.info(
      `New user registered successfully: ${JSON.stringify({ newUser })}`,
    );

    // Generate JWT Token
    const token = createToken(newUser._id);
    if (!token) {
      logger.error(
        `Failed to create JWT token for user: ${newUser._id}. Deleting user.`,
      );

      // If token creation fails, remove user and log error
      await User.findByIdAndDelete(newUser._id);
      return badRequest(
        res,
        "Failed to generate authentication token. Please try again later.",
      );
    }

    // Success Response
    return success(
      res,
      { token, user: { _id: newUser._id } },
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
exports.login = async (req, res, next) => {
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
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      logger.warn(`Login failed: User not found with email "${email}"`);
      return notFound(res, `User not found with email: ${email}`);
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      logger.warn(`Unauthorized: Incorrect credentials for "${email}"`);
      return unauthorized(
        res,
        "Incorrect email or password. Please try again.",
      );
    }

    // Create JWT and send response
    const token = createToken(user._id);
    if (!token) {
      logger.error(
        `ServerError: Failed to create JWT token for user ID: ${user._id}`,
      );
      return serverError(
        res,
        "Failed to generate authentication token. Please try again later.",
      );
    }

    // Success Response
    return success(
      res,
      { token, user: { _id: user._id, role: user.role } },
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
exports.forgot_password = async (req, res, next) => {
  setupLogger(`${logfile_folder}/forgot-password`);
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
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`NotFound: User with email "${email}" not found.`);
      return notFound(res, `No user found with this email: ${email}`);
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    if (!resetToken) {
      logger.error(
        `ServerError: Failed to create password reset token for user ID: ${user._id}`,
      );
      return serverError(
        res,
        "Failed to generate password reset token. Please try again later.",
      );
    }

    await user.save({ validateBeforeSave: false });

    // Send resetToken to user's email
    try {
      await sendMail({
        to: user.email,
        subject: "Reset Your Password",
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
    } catch (error) {
      // Rollback token fields if email sending fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save({ validateBeforeSave: false });

      // Error Response
      logger.error(
        "Error while sending reset email: ",
        JSON.stringify({ message: error?.message || "", stack: error?.stack }),
      );
      return serverError(
        res,
        "Error sending reset email. Please try again later!.",
        error,
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
      "Internal server error occure while forgot password.",
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
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      logger.warn(`NotFound: Invalid or expired reset token.`);
      return notFound(res, "Token is invalid or has expired.");
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate new JWT token after password reset
    const authToken = createToken(user._id);
    if (!authToken) {
      logger.error(
        `ServerError: Failed to create JWT token for user ID: ${user.id}`,
      );
      return serverError(
        res,
        "Password reset completed, but failed to generate auth token.",
      );
    }

    // Success Response
    return success(
      res,
      { token: authToken, user: { _id: user._id, role: user.role } },
      "Password reset successful",
    );
  } catch (error) {
    console.log("Reset password Error:", error?.message || "");
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
    const user = await User.findById(req.user.id);

    return success(res, user, "User profile retrieved successfully");
  } catch (error) {
    console.log("Getting me Error:", error?.message || "");
    logger.error(
      "Error during get me: ",
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
    const user = await User.findById(req.user.id);
    if (!user) {
      logger.warn("Unauthorized: Token is invalid or has expired.");
      return unauthorized(
        res,
        "Your session has expired or token is invalid.\nPlease log in again.",
      );
    }

    // Update data
    const updateUser = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-createdAt -updatedAt");

    // Success response
    return success(
      res,
      updateUser,
      "Your profile has been updated successfully.",
    );
  } catch (error) {
    console.log("Update me Error:", error?.message || "");
    logger.error(
      "Error during updating me: ",
      JSON.stringify({ message: error?.message || "", stack: error?.stack }),
    );
    return serverError(
      res,
      "Internal server error occured while updating your profile",
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
    const user = await User.findById(req.user.id).select("+password");
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn(
        `Incorrect current password entered for user ID: ${user._id}`,
      );
      return unauthorized(
        res,
        "Your current password is incorrect. Please try again.",
      );
    }

    // Prevent same password reuse
    if (password === newPassword) {
      logger.warn(`User ID: ${user._id} attempted to reuse the same password.`);
      return badRequest(
        res,
        "Your new password cannot be the same as the old one.",
      );
    }

    // Store old password in case rollback is needed
    const oldPassword = password;

    user.password = newPassword;
    await user.save();

    // Generate new JWT token after password update
    const token = createToken(user._id);
    if (!token) {
      logger.error(`JWT token generation failed for user: ${user._id}`);
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
      { token, user: { _id: user._id, role: user.role } },
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
    const users = await User.find({ role: "user" }).select(
      "-createdAt -updatedAt",
    );
    return success(res, users, "Users retrieved successfully");
  } catch (error) {
    console.log("Get all user list Error:", error?.message || "");
    logger.error(
      "Error during get all user list: ",
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

    // Base filter: only users with role = "user"
    let filter = { role: "user" };

    // Add search condition if provided
    if (search && search.trim() !== "") {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Count total users AND Pagination query Bot Wor parallel
    const [totalUsers, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("-createdAt -updatedAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    // Sucess message
    return paginated(
      res,
      users,
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
    const { _id } = req.query;
    if (!_id) {
      logger.warn(`BadRequest: Invalid or missing user ID (${_id})`);
      return badRequest(res, "A valid user ID is required.");
    }

    // Fetch user from database
    const user = await User.findById({ _id }).select("-createdAt -updatedAt");
    if (!user) {
      logger.warn(`NotFound: No user found with ID: ${_id}`);
      return notFound(res, "No user found with that ID");
    }

    // Success Response
    return success(res, user, "User retrieved successfully");
  } catch (error) {
    console.log("Error retrieved user:", error?.message || "");
    logger.error(
      "Error retrieved user: ",
      JSON.stringify({ message: error?.message || "", stack: error?.stack }),
    );
    return serverError(
      res,
      "Internal server error occured while retrieving used.",
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
 * @body    { _id, status }
 * @returns {Object}
 * @throws {Error}
 */
exports.update_user = async (req, res) => {
  setupLogger(`${logfile_folder}/update_user`);
  try {
    // Validate ID
    const { _id, active } = req.query;
    if (!_id) {
      logger.warn(`BadRequest: Invalid or missing user ID (${_id})`);
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

    // Find user by ID and Update status
    const user = await User.findByIdAndUpdate(
      { _id },
      { active },
      { new: true, runValidators: true },
    ).select("-createdAt -updatedAt");
    if (!user) {
      logger.warn(`NotFound: No user found with ID ${_id}`);
      return notFound(res, "No user found with that ID");
    }

    // Success Response
    return success(res, user, "User status updated successfully.");
  } catch (error) {
    console.log("Error occured updating user status:", error?.message || "");
    logger.error(
      "Error occured updating user status: ",
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
 * @body    { _id }
 * @returns {Object}
 * @throws {Error}
 */
exports.delete_user = async (req, res) => {
  setupLogger(`${logfile_folder}/delete_user`);
  try {
    // Validate ID
    const { _id } = req.query;
    if (!_id) {
      logger.warn(`BadRequest: Invalid or missing user ID (${_id})`);
      return badRequest(res, "A valid numeric user ID is required.");
    }

    const user = await User.findByIdAndDelete({ _id });
    if (!user) {
      logger.warn(`NotFound: No user found with ID: ${_id}`);
      return notFound(res, "No user found with that ID");
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
