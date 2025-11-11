// ./src/routes/index.js

const router = require("express").Router();
const userRoutes = require("./user.routes.js");
const docsRoutes = require("./docs.routes.js");

/* ------------------------------- All routes ------------------------------- */
router.use("/auth", userRoutes);
router.use("/docs", docsRoutes);

module.exports = router;