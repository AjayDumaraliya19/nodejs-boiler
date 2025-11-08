// ./src/controllers/user.controller.js

const User = require("../models/user.model.js");
const crypto = require("crypto");
const { createToken } = require("../middlewares/auth.js");
const { sendMail, generateEmailMessage } = require("../helpers/mail.js");
const {
  setupLogger,
  logger,
  logRequestDetails } = require("../helpers/logger.js");
const {
  conflict,
  success,
  serverError,
  notFound,
  unauthorized,
  paginated } = require("../utils/responses.js");

const logfile_folder = "user_controller";   // Common logger Folder Name

/* -------------------------------------------------------------------------- */
/*                            USER REGISTRATION API                           */
/* -------------------------------------------------------------------------- */
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
    const { name, email, password } = req.body;

    // Check Duplicate Email -----
    const emailExist = await User.exists({ email });
    if (emailExist) {
      logger.warn(`Conflict: Email "${email}" already exists`);
      return conflict(res, `email "${email}" that already exists..!`);
    }

    // Create New User -----
    const newUser = await User.create({ name, email, password });
    logger.info(`New user registered successfully: ${JSON.stringify({ newUser })}`);

    // Generate JWT Token -----
    const token = createToken(newUser._id);
    if (!token) {
      logger.error(`Failed to create JWT token for user: ${newUser._id}. Removing user.`);

      // If token creation fails, remove user and log error -----
      await User.findByIdAndDelete(newUser._id);

      return serverError(res, "Failed to generate authentication token. Please try again later.")
    }

    // Success Response -----
    return success(res, { token, user: { _id: newUser._id } }, "User registered successfully");
  } catch (error) {
    console.log("Register Error:", error?.message || "");
    logger.error("Error during registration: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
    return serverError(res, "Internal server error during registration.", error);
  } finally {
    logRequestDetails(req);
  }
};

/* -------------------------------------------------------------------------- */
/*                               USER LOGIN API                               */
/* -------------------------------------------------------------------------- */
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
    const { email, password } = req.body;

    // Check id user exists and password is correct -----
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      logger.warn(`Login failed: No user found with email "${email}"`);
      return notFound(res, `No user found with email: ${email}`);
    }

    // Verify password -----
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      logger.warn(`Invalid password attempt for user: ${email}`);
      return unauthorized(res, "Invalid email or password.");
    }

    // Create JWT and send response -----
    const token = createToken(user._id);
    if (!token) {
      logger.error(`JWT token generation failed for user: ${user._id}`);
      return serverError(res, "Failed to generate authentication token. Please try again later.")
    }

    // Success Response -----
    return success(res, { token, user: { _id: user._id, role: user.role } }, "User logged in successfully");
  } catch (error) {
    console.log("Login Error:", error?.message || "");
    logger.error("Error during login: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
    return serverError(res, "Internal server error during login.", error);
  } finally {
    logRequestDetails(req);
  }
};

/* -------------------------------------------------------------------------- */
/*                            USER FORGOT PASSWORD                            */
/* -------------------------------------------------------------------------- */
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
    const { email } = req.body;

    // Find user based on POSTed email -----
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Found failed: No user found with email "${email}"`);
      return notFound(res, `No user found with email: ${email}`);
    }

    // Generate reset token -----
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    console.log(resetToken, "==== resetToken")

    // Send resetToken via email using sendMail
    try {
      await sendMail({
        to: user.email,
        subject: "Reset Your Password - IconBuzzer Admin",
        html: generateEmailMessage(
          "Password Reset Request",
          "We received a request to reset your password. Use the TOKEN below to reset your password:",
          user?.name || "User",
          resetToken
        ),
      });

      // Success Response -----
      return success(res, null, "Reset token sent to email!");
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      // Error Response -----
      logger.error("Error during Sending mail: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
      return serverError(res, "There was an error sending the email. Try again later!.", error);
    }
  } catch (error) {
    console.log("Forgot password Error:", error?.message || "");
    logger.error("Error during forgot password: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
    return serverError(res, "Internal server error during forgot password.", error);
  } finally {
    logRequestDetails(req);
  }
}

/* -------------------------------------------------------------------------- */
/*                             USER RESET PASSWORD                            */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Reset password
 * @route   PATCH /user/reset-password/:token
 * @access  Public
 * @body    { password, passwordConfirm }
 * @returns {Object}
 * @throws {Error}
 */
exports.reset_password = async (req, res) => {
  setupLogger(`${logfile_folder}/reset-password`);
  try {
    const { token } = req.query;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
    if (!user) {
      logger.warn(`Token is invalid or has expired`);
      return notFound(res, `Token is invalid or has expired`);
    };

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Create JWT and send response -----
    const authtoken = createToken(user._id);
    if (!authtoken) {
      logger.error(`JWT token generation failed for user: ${user._id}`);
      return serverError(res, "Failed to generate authentication token. Please try again later.")
    }

    // Success Response -----
    return success(res, { token: authtoken, user: { _id: user._id, role: user.role } }, "Reset password successfully");
  } catch (error) {
    console.log("Reset password Error:", error?.message || "");
    logger.error("Error during reset password: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
    return serverError(res, "Internal server error during reset password.", error);
  } finally {
    logRequestDetails(req);
  }
};

/* -------------------------------------------------------------------------- */
/*                                 USER GET ME                                */
/* -------------------------------------------------------------------------- */
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

    return success(res, user, "Successfully Get Data..!");
  } catch (error) {
    console.log("Getting me Error:", error?.message || "");
    logger.error("Error during get me: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
    return serverError(res, "Internal server error during get me.", error);
  } finally {
    logRequestDetails(req);
  }
};

/* -------------------------------------------------------------------------- */
/*                               USER UPDATE ME                               */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Update user details
 * @route   PATCH /user/update-me
 * @access  Private
 * @body    { name, email, password, passwordConfirm }
 * @returns {Object}
 * @throws {Error}
 */
exports.update_me = async (req, res) => {
  setupLogger(`${logfile_folder}/update-me`);
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      logger.warn(`Token is invalid or has expired`);
      return notFound(res, `Token is invalid or has expired`);
    };

    const updateUser = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true, runValidators: true }
    ).select("-createdAt -updatedAt");

    return success(res, updateUser, "Update me successfully..!");
  } catch (error) {
    console.log("Update me Error:", error?.message || "");
    logger.error("Error during updating me: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
    return serverError(res, "Internal server error during updating me.", error);
  } finally {
    logRequestDetails(req);
  }
};

/* -------------------------------------------------------------------------- */
/*                            USER UPDATE PASSWORD                            */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Update user password
 * @route   PATCH /user/update-password
 * @access  Private
 * @body    { password, newpassword, newpasswordConfirm }
 * @returns {Object}
 * @throws {Error}
 */
exports.update_password = async (req, res) => {
  setupLogger(`${logfile_folder}/update-password`);
  try {
    const { password, newpassword, newpasswordConfirm } = req.body;
    const user = await User.findById(req.user.id).select("+password");
    const checkPassword = await user.comparePassword(password);
    if (!checkPassword) {
      logger.warn(`Enter wrong password. _id: ${user._id}`);
      return unauthorized(res, "Your current password is wrong.");
    };

    user.password = newpassword;
    user.passwordConfirm = newpasswordConfirm;
    await user.save();

    // Create JWT and send response -----
    const token = createToken(user._id);
    if (!token) {
      logger.error(`JWT token generation failed for user: ${user._id}`);
      return serverError(res, "Failed to generate authentication token. Please try again later.")
    }

    // Success Response -----
    return success(res, { token, user: { _id: user._id, role: user.role } }, "User update password successfully");
  } catch (error) {
    console.log("Updating password Error:", error?.message || "");
    logger.error("Error during updating password: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
    return serverError(res, "Internal server error during updating password.", error);
  } finally {
    logRequestDetails(req);
  }
};

/* -------------------------------------------------------------------------- */
/*                                 USER LOGOUT                                */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Logout user
 * @route   GET /user/logout
 * @access  Private
 * @returns {Object}
 * @throws {Error}
 */
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  success(res, "User logged out successfully");
};

/* -------------------------------------------------------------------------- */
/*                             ADMIN Get ALL USERS                            */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Get all users
 * @route   GET admin/user/list
 * @access  Private/Admin
 * @returns {Object}
 * @throws {Error}
 */
exports.user_list = async (req, res) => {
  setupLogger(`${logfile_folder}/user_list`);
  try {
    const users = await User.find({ role: "user" }).select("-createdAt -updatedAt");
    return success(res, users, "Successfully");
  } catch (error) {
    console.log("Get all user list Error:", error?.message || "");
    logger.error("Error during get all user list: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
    return serverError(res, "Internal server error during get all user list.", error);
  } finally {
    logRequestDetails(req);
  }
};

/* -------------------------------------------------------------------------- */
/*                     ADMIN Get users by Pagination Wise                     */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Get all users with pagination wise
 * @route   GET admin/user/pagelist
 * @access  Private/Admin
 * @returns {Object}
 * @throws {Error}
 */
exports.user_list_pagination = async (req, res) => {
  setupLogger(`${logfile_folder}/user_list_pagination`);
  try {
    let { page = 1, limit = 10, search = "" } = req.query;

    // Convert to numbers -----
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    // Ensure valid values ----
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    // Base filter: only users with role = "user" -----
    let filter = { role: "user" };

    // Add search condition if provided -----
    if (search && search.trim() !== "") {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    };

    // Count total users AND Pagination query Bot Wor parallel ----
    const [totalUsers, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("-createdAt -updatedAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit).lean()
    ]);

    // Sucess message -----
    return paginated(res, users, totalUsers, page, limit, "User list fetched successfully");
  } catch (error) {
    console.log("Get users Error:", error?.message || "");
    logger.error("Error during get users: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
    return serverError(res, "Internal server error during get users.", error);
  } finally {
    logRequestDetails(req);
  }
}

/* -------------------------------------------------------------------------- */
/*                            ADMIN Get single User                           */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Get single users
 * @route   GET admin/user/:id
 * @access  Private/Admin
 * @returns {Object}
 * @throws {Error}
 */
exports.get_user = async (req, res) => {
  setupLogger(`${logfile_folder}/userby_id`);
  try {
    const { _id } = req.query;
    const user = await User.findById({ _id }).select("-createdAt -updatedAt");
    if (!user) {
      logger.warn(`No user find with _id: ${_id}`);
      return notFound(res, "No user found with that ID");
    }

    return success(res, user, "User found successfully..!");
  } catch (error) {
    console.log("Get user by id Error:", error?.message || "");
    logger.error("Error during get user by id: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
    return serverError(res, "Internal server error during get user by id.", error);
  } finally {
    logRequestDetails(req);
  }
};

/* -------------------------------------------------------------------------- */
/*                           ADMIN update user statu                          */
/* -------------------------------------------------------------------------- */
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
    const { _id } = req.query;
    const user = await User.findByIdAndUpdate(
      { _id },
      req.body,
      { new: true, runValidators: true }
    ).select("-createdAt -updatedAt");
    if (!user) {
      logger.warn(`No user found with ID: ${_id}`);
      return notFound(res, "No user found with that ID");
    };

    return success(res, user, "User update successfully..!");
  } catch (error) {
    console.log("Update user by id Error:", error?.message || "");
    logger.error("Error during update user by id: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
    return serverError(res, "Internal server error during update user by id.", error);
  } finally {
    logRequestDetails(req);
  }
}

/* -------------------------------------------------------------------------- */
/*                         ADMIN Delete user permanent                        */
/* -------------------------------------------------------------------------- */
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
    const { _id } = req.query;
    const user = await User.findByIdAndDelete({ _id });
    if (!user) {
      logger.warn(`No user found with ID: ${_id}`);
      return notFound(res, "No user found with that ID");
    };

    return success(res, user, "User delete successfully..!");
  } catch (error) {
    console.log("Delete user by id Error:", error?.message || "");
    logger.error("Error during delete user by id: ", JSON.stringify({ message: error?.message || "", stack: error?.stack }));
    return serverError(res, "Internal server error during delete user by id.", error);
  } finally {
    logRequestDetails(req);
  }
}