// ./src/models/user.model.js

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { pool } = require("../db/connectionDB.js");
const { logger } = require("../helpers/logger.js");
const {
  insertQuery,
  deleteQuery,
  getListQuery,
  updateQuery,
  getPageListQuery,
} = require("./common.model.js");

const tbl1 = "users";

/* -------------------------------------------------------------------------- */
/*                              USER MODEL CLASS                              */
/* -------------------------------------------------------------------------- */
class User {
  constructor({
    id,
    name,
    email,
    password,
    role = "user",
    active = true,
    password_reset_token = null,
    password_reset_expires = null,
    password_changed_at = null,
    created_at = new Date(),
    updated_at = new Date(),
  } = {}) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
    this.active = active;
    this.password_reset_token = password_reset_token;
    this.password_reset_expires = password_reset_expires;
    this.password_changed_at = password_changed_at;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  /* ------------------------------ Sanitize User ----------------------------- */
  static sanitize(userData) {
    // Remove sensitive fields
    const {
      password,
      password_reset_token,
      password_reset_expires,
      password_changed_at,
      ...cleanData
    } = userData;
    return cleanData;
  }

  /* -------------- Automatically sanitize when JSON is generated ------------- */
  toJSON() {
    return User.sanitize(this);
  }

  /* ---------------------------- Create a new User --------------------------- */
  static async create(user) {
    try {
      // Password Hashing
      const hash_password = await this.passwordHashing(user.password);
      user.password = hash_password;

      const { data: insert, error } = await insertQuery(pool, tbl1, user, "*");
      if (error) {
        logger.error("Data inserting error:", error);
        throw new Error(error?.message);
      }

      return User.sanitize(new User(insert[0]));
    } catch (error) {
      logger.error("Create User Error:", error);
      throw error;
    }
  }

  /* ------------------------------ Get Data list ----------------------------- */
  static async findAllData(user, fields) {
    try {
      if (user?.email?.length) user.email = user?.email.replace(/'/g, "''");

      const { data: users, error } = await getListQuery(
        pool,
        tbl1,
        user,
        fields,
      );
      if (error) {
        logger.error("Find User data error:", error);
        throw new Error(error?.message);
      }

      return users.map((u) => User.sanitize(new User(u)));
    } catch (error) {
      logger.error("FindData Error:", error);
      throw error;
    }
  }

  /* ------------------------------ Get Data list ----------------------------- */
  static async findData(user, fields) {
    try {
      const { data: users, error } = await getListQuery(
        pool,
        tbl1,
        user,
        fields,
      );
      if (error) {
        logger.error("Find User data error:", error);
        throw new Error(error?.message);
      }

      return users?.length ? new User(users[0]) : null;
    } catch (error) {
      logger.error("FindData Error:", error);
      throw error;
    }
  }

  /* -------------------------- Get Data with pagination -------------------------- */
  static async findDataWithPagination(
    whereClause,
    fields,
    page,
    limit,
    search,
    columns,
    order,
  ) {
    try {
      const { data: result, error } = await getPageListQuery(
        pool,
        tbl1,
        fields,
        whereClause,
        page,
        limit,
        search,
        columns,
        order,
      );
      if (error) {
        logger.error("Data find pagination error:", error);
        throw new Error(error?.message);
      }

      result.data = result.data.map((u) => User.sanitize(new User(u)));
      return result;
    } catch (error) {
      logger.error("FindData pagination Error:", error);
      throw error;
    }
  }

  /* ------------------------ Find email with password ------------------------ */
  static async findByEmail(userReq) {
    try {
      const { data: users, error } = await getListQuery(pool, tbl1, {
        email: userReq?.email,
      });
      if (error) {
        logger.error("Find by email error:", error);
        throw new Error(error.message);
      }
      if (!users?.length) {
        logger.warn(`User with email "${userReq?.email}" not found.`);
        return null;
      }

      // Create a User instance
      const user = new User(users[0]);

      if (userReq?.password) {
        // Compare password using instance method
        const isPasswordValid = await user.comparePassword(userReq?.password);
        if (!isPasswordValid) {
          logger.warn(
            `Unauthorized: Incorrect password for user "${userReq?.email}"`,
          );
          return null;
        }
      }

      // Return user instance (unsanitized)
      return user;
    } catch (err) {
      logger.error("findByEmailWithPassword Error:", err);
      throw err;
    }
  }

  /* ------------------------ Find user by reset token ------------------------ */
  static async findByToken({ token, newPassword }) {
    try {
      // Hash the token to compare securely
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // Find user with valid token (not expired)
      const whereClause = `password_reset_token = '${hashedToken}' AND password_reset_expires > CURRENT_TIMESTAMP`;

      const { data: users, error } = await getListQuery(
        pool,
        tbl1,
        whereClause,
      );
      if (error) {
        logger.error("Data find by token error:", error);
        throw new Error(error?.message);
      }
      if (!users?.length) {
        logger.warn("No user found with this reset token or token expired.");
        return null;
      }

      // Create User instance
      const user = new User(users[0]);

      // Update password securely
      const updatedUser = await user.updatePassword(newPassword);
      if (!updatedUser) {
        logger.error(
          `Failed to update password for user: ${JSON.stringify(user)}`,
        );
        return null;
      }

      logger.info(`Password successfully reset for user ID: ${user.id}`);
      return updatedUser;
    } catch (error) {
      logger.error("FindByToken Error:", error);
      throw error;
    }
  }

  /* ------------------------------- Update user ------------------------------ */
  async save() {
    try {
      const { id, ...rest } = this;
      const { data: updated, error } = await updateQuery(
        pool,
        tbl1,
        { id },
        rest,
      );
      if (error) {
        logger.error("Data updating error:", error);
        throw new Error(`Data updating error: ${error?.message}`);
      }

      return updated?.length ? User.sanitize(new User(updated[0])) : null;
    } catch (error) {
      logger.error("User Save Error:", error);
      throw error;
    }
  }

  /* -------------------------- Permanent DELETE User ------------------------- */
  static async delete(id) {
    try {
      // Prevent deletion of admin users
      const admin = await this.findData({ id, role: "admin" });
      if (admin) {
        logger.warn(`Attempt to delete admin account blocked: ID ${id}`);
        throw new Error("You cannot delete an admin account.");
      }

      const { error } = await deleteQuery(pool, tbl1, `id = ${id}`);
      if (error) {
        logger.error("Data deleting error:", error);
        throw new Error(`Data deleting error: ${error?.message}`);
      }

      return true;
    } catch (error) {
      logger.error("User Delete Error:", error);
      throw error;
    }
  }

  /* ---------------------------- Password Hashing ---------------------------- */
  static async passwordHashing(userPassword) {
    const salt = await bcrypt.genSalt(12);
    const hash_password = await bcrypt.hash(userPassword, salt);
    return hash_password;
  }

  /* ---------------------- Check if password is correct ---------------------- */
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  /* --------------- Check if password was changed after JWT issued ----------- */
  changedPasswordAfter(JWTTimestamp) {
    if (this.password_changed_at) {
      const changedTimestamp = parseInt(
        this.password_changed_at.getTime() / 1000,
        10,
      );
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  }

  /* --------------------------- Create reset token --------------------------- */
  createPasswordResetToken() {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.password_reset_token = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.password_reset_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    return resetToken;
  }

  /* ------------------------------ Update Password --------------------------- */
  async updatePassword(newPassword) {
    this.password = await bcrypt.hash(newPassword, 12);
    this.password_changed_at = new Date().toISOString(); // Convert to ISO string for proper PostgreSQL timestamp
    this.password_reset_token = null;
    this.password_reset_expires = null;
    return await this.save();
  }
}

module.exports = User;
