const express = require("express")
const { check } = require("express-validator")
const user_controller = require("../controller/user")
const Authorization = require("../middleware/auth")
//creating the Router
const route = express.Router()
const admin_model = require("../models/admin-model")
const student_model = require("../models/user_model")
const { decrypt_password } = require("../utils/helper")


route.post("/register", [
    check("regNo").notEmpty().withMessage("Registration Number is Required")
        .custom(async (value, { req }) => {
            const isThere = await student_model.findOne({ regNo: value })
            if (isThere) {
                const error = new Error("Registration Number already exist please try a new one")
                error.status = 500
                throw error
            }
            return true
        }),
    check("firstname").notEmpty().withMessage("Student First Name is Required"),
    check("lastname").notEmpty().withMessage("Student Last Name is Required"),
    check("class").notEmpty().withMessage("Student Class is required")
], user_controller.student_signup)

route.post("/login", [
    check("regNo").notEmpty().withMessage("Registration Number is Required")
], user_controller.student_signin)

route.post("/admin/register", [
    check("email").notEmpty().withMessage("email field cannot be empty")
        .custom(async (value, { req }) => {
            const isThere = await admin_model.findOne({ email: value })
            if (isThere) {
                const error = new Error("Email already exist please try a new one")
                error.status = 500
                throw error
            }
            return true
        }),
    check("password")
        .notEmpty()
        .withMessage("Password field is required")
        .isLength({ min: 8 })
        .withMessage("Password too short")
        .isStrongPassword()
        .withMessage(
            "Password must contain a special character, a capital letter and greater than 8 characters"
        )
], user_controller.admin_signup)

route.post("/admin/login", [
    check("email").notEmpty().withMessage("Email is required")
        .custom(async (value, { req }) => {
            const user = await admin_model.findOne({ email: value })
            if (!user) {
                const error = new Error("Incorrect Email or Password")
                error.status = 500;
                throw error
            }
            return true
        }),
    check("password").notEmpty().withMessage("Password is required")
        .custom(async (value, { req }) => {
            const user = await admin_model.findOne({ email: req.body.email })
            if (!user) {
                const error = new Error("Incorrect Email or Password")
                error.status = 500;
                throw error
            }
            const isSame = await decrypt_password(value, user.password)
            if (!isSame) {
                const error = new Error("Incorrect Email or Password")
                error.status = 500;
                throw error
            }
            return true
        })
], user_controller.admin_signin)

route.put("/update/:id", [
    [
        check("regNo").notEmpty().withMessage("Registration Number is Required")
            .custom(async (value, { req }) => {
                const isThere = await student_model.findOne({ regNo: value })
                if (isThere) {
                    const error = new Error("Registration Number already exist please try a new one")
                    error.status = 500
                    throw error
                }
                return true
            }),
        check("firstname").notEmpty().withMessage("Student First Name is Required"),
        check("lastname").notEmpty().withMessage("Student Last Name is Required"),
        check("class").notEmpty().withMessage("Student Class is required")
    ]
], Authorization, user_controller.update_student)

route.get("/student/:id", Authorization, user_controller.fetch_student)

module.exports = route