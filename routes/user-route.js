const express = require("express")
const { check } = require("express-validator")
const user_controller = require("../controller/user")
//creating the Router
const route = express.Router()


route.post("/register", [
    check("regNo").notEmpty().withMessage("Registration Number is Required")
        .custom(async (value, { req }) => {

        }),
    check("firstname").notEmpty().withMessage("Student First Name is Required"),
    check("lastname").notEmpty().withMessage("Student Last Name is Required"),
    check("class").notEmpty().withMessage("Student Class is required")
], user_controller.student_signup)

route.post("/login", [
    check("regNo").notEmpty().withMessage("Registration Number is Required")
], user_controller.student_signin)

route.post("/admin/register", [
    check("email").notEmpty().withMessage("Email is required"),
    check("password").notEmpty().withMessage("Password is required")
], user_controller.admin_signup)

route.post("/admin/login", [
    check("email").notEmpty().withMessage("Email is required"),
    check("password").notEmpty().withMessage("Password is required")
], user_controller.admin_signin)

route.put("/update/:id", user_controller.update_student)

module.exports = route