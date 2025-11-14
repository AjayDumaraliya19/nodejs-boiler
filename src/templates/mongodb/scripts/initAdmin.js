// ./scripts/initAdmin.js

const User = require("../src/models/user.model.js");
const { connectDB } = require("../src/db/mongooseDB.js");

/* -------------------------------------------------------------------------- */
/*                            Initialize Admin User                           */
/* -------------------------------------------------------------------------- */
const initAdmin = async () => {
  try {
    // Check if any admin exists -----
    const adminExists = await User.findOne({ role: "admin", active: true });
    if (adminExists) {
      console.log("Admin user already exists. No action needed.");
      process.exit(0);
    };

    // Create admin user -----
    const name = "Admin";
    const email = "admin@example.com";
    const password = "admin@123";

    await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: "admin",
    });

    console.log("==========================================");
    console.log("✅ Admin user created successfully!");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);
    console.log("🔑 Role: admin");
    console.log("==========================================");
    console.log("⚠️  IMPORTANT: Change the password after first login!");
    console.log("==========================================");

    process.exit(0);
  } catch (error) {
    console.error("Error initializing admin:", error);
    process.exit(1);
  }
};

// Run the initialization -----
(async () => {
  await connectDB();
  await initAdmin();
})();
