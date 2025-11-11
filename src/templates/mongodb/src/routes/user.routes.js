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
router.post("/register", validate(userValidation.register_validation), userControllers.register);
router.post("/login", validate(userValidation.login_validation), userControllers.login);
router.post("/forgot-password", validate(userValidation.forgot_validation), userControllers.forgot_password);
router.patch("/reset-password", validate(userValidation.reset_validation), userControllers.reset_password);

/* -------------------------------------------------------------------------- */
/*                  Protected routes (require authentication)                 */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Protected routes
 */
router.use(protect);
router.get("/me", userControllers.get_me);
router.patch("/update-me", userControllers.update_me);
router.patch("/update-password", validate(userValidation.updatePassword_validation), userControllers.update_password);
router.get("/logout", userControllers.logout);

/* -------------------------------------------------------------------------- */
/*                          Restrict to "Admin" only                          */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Restrict to "Admin" only
 */
router.use(restrictTo(["admin"]));
router.get("/admin/user/list", userControllers.user_list);
router.post("/admin/user/pagelist", validate(userValidation.userListPagination_validation), userControllers.user_list_pagination);
router.get("/admin/user", validate(userValidation.userById_validation), userControllers.get_user);
router.patch("/admin/user", validate(userValidation.updateUser_validation), userControllers.update_user);
router.delete("/admin/user", validate(userValidation.deleteUser_validation), userControllers.delete_user);

module.exports = router;