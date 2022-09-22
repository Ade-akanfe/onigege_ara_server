const { validationResult } = require("express-validator")
const user_model = require("../models/user_model")





const controller = {
    student_signup: async (req, res, next) => {
        `This function register a new Student and can be done
         by the admin`
        try {
            const { regNo, firstname, lastname, middlename, class: student_class } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            const new_student = new user_model({
                regNo,
                firstname,
                lastname,
                middlename: middlename ? middlename : "",
                class: student_class
            })
            console.log(new_student)
            res.status(200).json({ msg: "Ademola" })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    student_signin: async (req, res, next) => {
        try {
            const { regNo } = req.body

            const user = await user_model.findOne({ regNo })
            if (!user) {
                return next({ message: "User with Registration Number can't be found", status: 400 })
            }
            res.status(200).json({ message: "Login" })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    admin_signup: async (req, res, next) => {
        try {
            const { email,password } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            const new_student = new user_model({
                regNo,
                firstname,
                lastname,
                middlename: middlename ? middlename : "",
                class: student_class
            })
            console.log(new_student)
            res.status(200).json({ msg: "Ademola" })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    admin_signin: async (req, res, next) => { },
    update_student: async (req, res, next) => { }


}
module.exports = controller