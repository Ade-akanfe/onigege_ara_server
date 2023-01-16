
const express = require("express")
const { check } = require("express-validator")
const controller = require("../controller/email")
const Admin = require("../middleware/admin-only")
const Authorization = require("../middleware/auth")
const route = express.Router()

route.post("/subscribe", [
    check("email").notEmpty().withMessage("email field cannot be empty")
        .isEmail().withMessage("Please Enter valid Email Address")
], controller.subscribe)

route.post("/unsubscribe", [
    check("email").notEmpty().withMessage("Email field is required")
        .isEmail().withMessage("Email is not a valid email")
], controller.unsubscribe)


route.post("/direct_message", [
    check("name").notEmpty().withMessage("name is required"),
    check("email").notEmpty().withMessage("Email field is required")
        .isEmail().withMessage("Email is not a valid email"),
    check("message").notEmpty().notEmpty().withMessage("Message is required")
], controller.sendDirectMessage)

route.get("/messages", [
    check("title").notEmpty().withMessage("title is required for message sent"),
    check("message").notEmpty().withMessage("message is required"),
], Authorization, Admin, controller.sendUpdatees)


module.exports = route