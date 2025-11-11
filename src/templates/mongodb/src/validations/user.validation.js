;

/* -------------------------------------------------------------------------- */
/*             Delete User// ./src/validations/user.validation.js             */
/* -------------------------------------------------------------------------- */

const Joi = require("joi");
const { messages, password } = require("../utils/message.js");

/* -------------------------------------------------------------------------- */
/*                           Register Joi Validation                          */
/* -------------------------------------------------------------------------- */
/**
 * @desc Joi schema for validating user registration input.
 * @fields (name, email, password, passwordConfirm) all required
 * - name: non-empty string
 * - email: valid email format
 * - password: validated with custom password rules
 * - passwordConfirm: must match password
 */
exports.register_validation = {
    body: Joi.object({
        name: Joi.string().trim().required()
            .messages({
                "string.base": messages.string.base,
                "string.empty": messages.string.empty,
                "any.required": messages.any.required
            }),
        email: Joi.string().trim().email({ tlds: { allow: false } }).required()
            .messages({
                "string.base": messages.string.base,
                "string.email": "{{#label}} must be a valid email",
                "any.required": messages.any.required
            }),
        password: Joi.string().required()
            .custom(password, "Password Validation")
            .messages({
                "string.base": messages.string.base,
                "string.empty": messages.string.empty,
                "any.required": messages.any.required
            }),
        passwordConfirm: Joi.any().valid(Joi.ref("password")).required()
            .messages({
                "any.only": "Password confirmation does not match password",
                "any.required": messages.any.required
            })
    })
};

/* -------------------------------------------------------------------------- */
/*                            Login Joi Validation                            */
/* -------------------------------------------------------------------------- */
/**
 * @desc Joi schema for the user login input.
 * @fields (email, password) all required
 * - email: valid email format
 * - password: validated with custom password rules
 */
exports.login_validation = {
    body: Joi.object({
        email: Joi.string().trim().email({ tlds: { allow: false } }).required()
            .messages({
                "string.base": messages.string.base,
                "string.email": "{{#label}} must be a valid email",
                "any.required": messages.any.required
            }),
        password: Joi.string().required()
            .custom(password, "Password Validation")
            .messages({
                "string.base": messages.string.base,
                "string.empty": messages.string.empty,
                "any.required": messages.any.required
            })
    })
};

/* -------------------------------------------------------------------------- */
/*                         Forgot Password Validation                         */
/* -------------------------------------------------------------------------- */
/**
 * @desc Joi schema for the user forgot password input.
 * @fields (email) required
 * - email: valid email format
 */
exports.forgot_validation = {
    body: Joi.object({
        email: Joi.string().trim().email({ tlds: { allow: false } }).required()
            .messages({
                "string.base": messages.string.base,
                "string.email": "{{#label}} must be a valid email",
                "any.required": messages.any.required
            })
    })
};

/* -------------------------------------------------------------------------- */
/*                          Reset Password Validation                         */
/* -------------------------------------------------------------------------- */
/**
 * @desc Joi schema for the user reset password input.
 * @fields (token) required
 * - token: non-empty string
 */
exports.reset_validation = {
    query: Joi.object({
        token: Joi.string().trim().required()
            .messages({
                "string.base": messages.string.base,
                "string.empty": messages.string.empty,
                "any.required": messages.any.required
            })
    })
};

/* -------------------------------------------------------------------------- */
/*                                  Update Me                                 */
/* -------------------------------------------------------------------------- */
/**
 * @desc Joi schema for the user update me input.
 * @fields (name, email) optional
 * - name: non-empty string
 * - email: valid email format
 */
exports.updateMe_validation = {
    body: Joi.object({
        name: Joi.string().trim()
            .messages({
                "string.base": messages.string.base,
                "string.empty": messages.string.empty,
                "any.required": messages.any.required
            }),
        email: Joi.string().trim().email({ tlds: { allow: false } })
            .messages({
                "string.base": messages.string.base,
                "string.email": "{{#label}} must be a valid email",
                "any.required": messages.any.required
            })
    })
};

/* -------------------------------------------------------------------------- */
/*                               Update Password                              */
/* -------------------------------------------------------------------------- */
/**
 * @desc Joi schema for the user update password input.
 * @fields (password, newpassword, newpasswordConfirm) required
 * - password: validated with custom password rules
 * - newpassword: validated with custom password rules
 * - newpasswordConfirm: must match newpassword
 */
exports.updatePassword_validation = {
    body: Joi.object({
        password: Joi.string().required()
            .custom(password, "Password Validation")
            .messages({
                "string.base": messages.string.base,
                "string.empty": messages.string.empty,
                "any.required": messages.any.required
            }),
        newpassword: Joi.string().required()
            .custom(password, "Password Validation")
            .messages({
                "string.base": messages.string.base,
                "string.empty": messages.string.empty,
                "any.required": messages.any.required
            }),
        newpasswordConfirm: Joi.any().valid(Joi.ref("newpassword")).required()
            .messages({
                "any.only": "Password confirmation does not match password",
                "any.required": messages.any.required
            })
    })
};

/* -------------------------------------------------------------------------- */
/*                            User list pagination                            */
/* -------------------------------------------------------------------------- */
/**
 * @desc Joi schema for the user list pagination input.
 * @fields (page, limit, search) optional
 * - page: integer between 1 and 100
 * - limit: integer between 1 and 100
 * - search: non-empty string
 */
exports.userListPagination_validation = {
    query: Joi.object({
        page: Joi.number().integer().min(1).max(100).required()
            .messages({
                "number.base": messages.number.base,
                "number.integer": messages.number.integer,
                "number.min": messages.number.min,
                "number.max": messages.number.max,
                "any.required": messages.any.required
            }),
        limit: Joi.number().integer().min(1).max(100).required()
            .messages({
                "number.base": messages.number.base,
                "number.integer": messages.number.integer,
                "number.min": messages.number.min,
                "number.max": messages.number.max,
                "any.required": messages.any.required
            }),
        search: Joi.string().trim().optional().allow(null, "")
    })
}

/* -------------------------------------------------------------------------- */
/*                               Get User By Id                               */
/* -------------------------------------------------------------------------- */
/**
 * @desc Joi schema for the user by id input.
 * @fields (_id) required
 * - _id: non-empty string
 */
exports.userById_validation = {
    query: Joi.object({
        _id: Joi.string().trim().required()
            .messages({
                "string.base": messages.string.base,
                "string.empty": messages.string.empty,
                "any.required": messages.any.required
            })
    })
};

/* -------------------------------------------------------------------------- */
/*                                 Update User                                */
/* -------------------------------------------------------------------------- */
/**
 * @desc Joi schema for the user update input.
 * @fields (_id, active) required
 * - _id: non-empty string
 * - active: boolean
 */
exports.updateUser_validation = {
    query: Joi.object({
        _id: Joi.string().trim().required()
            .messages({
                "string.base": messages.string.base,
                "string.empty": messages.string.empty,
                "any.required": messages.any.required
            })
    }),
    body: Joi.object({
        active: Joi.boolean().required()
            .messages({
                "boolean.base": messages.boolean.base,
                "any.required": messages.any.required,
            })
    })
};

/* -------------------------------------------------------------------------- */
/*                                 Delete User                                */
/* -------------------------------------------------------------------------- */
/**
 * @desc Joi schema for the user delete input.
 * @fields (_id) required
 * - _id: non-empty string
 */
exports.deleteUser_validation = {
    query: Joi.object({
        _id: Joi.string().trim().required()
            .messages({
                "string.base": messages.string.base,
                "string.empty": messages.string.empty,
                "any.required": messages.any.required
            })
    })
}