const { validationResult } = require("express-validator")
const user_model = require("../models/user_model")
const admin_model = require("../models/admin-model")


const jwt = require("jsonwebtoken")
const { generate_token, generate_refresh_token, encrypt_password } = require("../utils/helper")

const token_model = require("../models/token-model")

const controller = {
    student_signup: async (req, res, next) => {
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
            const token = generate_token({ _id: new_student._id, class: new_student.class, regNo: new_student.regNo, type: "Student" })
            const refresh_token = generate_refresh_token()
            const token_data = new token_model({
                owner: new_student._id,
                token: [{
                    token,
                    expiresIn: new Date(Date.now()).getHours() + 2
                }],
                type: "Student",
                refresh_token
            })
            new_student.token = token_data._id
            await token_data.save()
            await new_student.save()
            res.status(200).json({ token: token, refresh_token })


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
            const token = generate_token({ _id: user._id, class: user.class, regNo: user.regNo })
            const token_data = await token_model.findOne({ owner: user._id, _id: user.token })
            token_data.token = [...token_data.token, {
                token,
                expiresIn: new Date(Date.now()).getHours() + 2
            }]
            res.status(200).json({ token: token, refresh_token: token_data.refresh_token })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    admin_signup: async (req, res, next) => {
        try {
            const { email, password } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            const passwordHashed = await encrypt_password(password)
            const admin = new admin_model({
                email,
                password: passwordHashed
            })
            const token = generate_token({ type: "Admin", _id: admin._id })
            const refresh_token = generate_refresh_token()

            const token_data = new token_model({
                owner: admin._id,
                refresh_token,
                type: "Admin",
                token: [
                    {
                        token,
                        expiresIn: new Date(Date.now()).getHours() + 2
                    }
                ]
            })
            admin.token = token_data._id
            await token_data.save()
            await admin.save()
            res.status(200).json({ _id: admin._id, refresh_token, accessToken: token })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    admin_signin: async (req, res, next) => {
        try {
            const { email, password } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }

            const admin = await admin_model.findOne({ email: email })

            const token = generate_token({ type: "Admin", _id: admin._id })
            const refresh_token = generate_refresh_token()

            const token_data = await token_model.findOneAndUpdate({
                owner: admin._id,
                _id: admin.token,
            }, {
                refresh_token
            })
            token_data.token = [...token_data.token, { token, expiresIn: new Date(Date.now()).getHours() + 2 }]
            await token_data.save()
            await admin.save()
            res.status(200).json({ token, _id: admin._id, refresh_token })

        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    update_student: async (req, res, next) => {
        try {
            const { id } = req.params
            const { firstname, lastname, middlename, regNo, class: stdClass } = req.body
            let user = await user_model.findByIdAndUpdate({ _id: id }, { firstname, lastname, middlename, regNo, class: stdClass })
            await user.save()
            res.status(200).json({ id, token: req.token, refresh_token: req.refresh_token })
        } catch (error) {
            if (!error.status) {
                error.status = 500;
            }
            res.status(error.status).json({ message: error.message });

        }
    },
    fetch_student: async (req, res, next) => {
        try {
            const { id } = req.params
            const user = await user_model.findOne({ _id: id }).select("-password").select("-token")
            if (!user) {
                return next({ message: "User not found", status: 500 })
            }

            res.status(200).json({ user })
        } catch (error) {
            if (!error.status) {
                error.status = 500;
            }
            res.status(error.status).json({ message: error.message });

        }
    }


}
module.exports = controller