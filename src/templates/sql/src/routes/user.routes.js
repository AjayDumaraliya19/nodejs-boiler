// ./src/routes/user.routes.js

const router = require("express").Router();
const validate = require("../middlewares/schemaValidation.js");
const { protect, restrictTo } = require("../middlewares/auth.js");
const { userControllers } = require("../controllers/index.js");
const { userValidation } = require("../validations/index.js");

/* -------------------------------------------------------------------------- */
/*                                Public Routes                               */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Public routes
 */
router.post(
  "/register",
  validate(userValidation.register_validation),
  userControllers.register,
); // Register a new user
router.post(
  "/login",
  validate(userValidation.login_validation),
  userControllers.login,
); // User login
router.post(
  "/forgot-password",
  validate(userValidation.forgot_validation),
  userControllers.forgot_password,
); // Forgot password
router.patch(
  "/reset-password",
  validate(userValidation.reset_validation),
  userControllers.reset_password,
); // Reset password

/* -------------------------------------------------------------------------- */
/*                  Protected routes (require authentication)                 */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Protected routes
 */
router.use(protect); // All routes below this middleware are protected
router.get("/me", userControllers.get_me); // Get current user profile
router.patch(
  "/update-me",
  validate(userValidation.updateMe_validation),
  userControllers.update_me,
); // Update current user profile
router.patch(
  "/update-password",
  validate(userValidation.updatePassword_validation),
  userControllers.update_password,
); // Update password

/* -------------------------------------------------------------------------- */
/*                          Restrict to "Admin" only                          */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Restrict to "Admin" only
 */
router.use(restrictTo(["admin"])); // All routes below this middleware are restricted to admin users only
router.get("/admin/users", userControllers.user_list); // Get all users (admin only)
router.post(
  "/admin/user/list",
  validate(userValidation.userListPagination_validation),
  userControllers.user_list_pagination,
); // Get all users with pagination wise (admin only)
router.get(
  "/admin/user",
  validate(userValidation.userById_validation),
  userControllers.get_user,
); // Get single user by ID (admin only)
router.patch(
  "/admin/user",
  validate(userValidation.updateUser_validation),
  userControllers.update_user,
); // Update user (admin only)
router.delete(
  "/admin/user",
  validate(userValidation.deleteUser_validation),
  userControllers.delete_user,
); // Delete user (admin only)

module.exports = router;
