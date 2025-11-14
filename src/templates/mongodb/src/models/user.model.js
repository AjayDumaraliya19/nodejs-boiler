// ./src/models/user.model.js

const Mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

/* -------------------------------------------------------------------------- */
/*                              USER MODEL SCHEMA                             */
/* -------------------------------------------------------------------------- */
/**
 * @type {Object}
 * @description User model schema
 * @property {string} name - User name
 * @property {string} email - User email
 * @property {string} password - User password
 * @property {string} passwordResetToken - User password reset token
 * @property {Date} passwordChangedAt - User password changed at
 * @property {string} role - User role
 * @property {boolean} active - User active status
 */
const userSchema = new Mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide your name"],
            trim: true,
            maxlength: [50, "Name cannot be more than 50 characters"]
        },
        email: {
            type: String,
            required: [true, "Please provide your email"],
            unique: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
        },
        password: {
            type: String,
            required: [true, "Please provide a password"],
            minlength: [8, "Password must be at least 8 characters long"],
            select: false // Don"t return password by default
        },
        passwordResetToken: {
            type: String,
            trim: true,
            select: false
        },
        passwordChangedAt: {
            type: Date,
            select: false,
            default: null
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
        active: {
            type: Boolean,
            default: true
        },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.password;
                delete ret.passwordChangedAt;
                delete ret.passwordResetToken;
                return ret;
            }
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.password;
                delete ret.passwordChangedAt;
                delete ret.passwordResetToken;
                return ret;
            }
        }
    }
);


/* -------------------------------------------------------------------------- */
/*                                   INDEXES                                  */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Create indexes for the user schema
 */
userSchema.index({ email: 1, active: 1 });
userSchema.index({ role: 1, active: 1 });


/* -------------------------------------------------------------------------- */
/*                                 Middleware                                 */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Middleware to hash password before saving
 */
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});


/**
 * @type {Function}
 * @description Update passwordChangedAt when password is modified
 */
userSchema.pre("save", function (next) {
    if (!this.isModified("password") || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000; // Ensure token is created after password change
    next();
});


/* -------------------------------------------------------------------------- */
/*                                   METHODS                                  */
/* -------------------------------------------------------------------------- */
/**
 * @type {Function}
 * @description Compare passwords
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};


/**
 * @type {Function}
 * @description Check if password changed after token issue
 */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    };
    return false;
};


/**
 * @type {Function}
 * @description Create Password Reset Token method
 */
userSchema.methods.createPasswordResetToken = function () {
    // Generate a random reset token (unhashed) -----
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token and set it to the document -----
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Set token expiration (e.g., 10 minutes) -----
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Return the plain token (to email to user) -----
    return resetToken;
}


/* -------------------------------------------------------------------------- */
/*                                Export Model                                */
/* -------------------------------------------------------------------------- */
const User = Mongoose.model("User", userSchema);
module.exports = User;