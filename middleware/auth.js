const jwt = require('jsonwebtoken')
const user_model = require("../models/user_model")
const admin_model = require("../models/admin-model")
const token_model = require("../models/token-model")
const { generate_token, generate_refresh_token } = require("../utils/helper")

const Authorization = async (req, res, next) => {
    try {
        const authorization = req.get("Authorization")
        const refresh_token = req.get("RefreshToken")
        const id = req.get("Id")

        if (!(authorization || refresh_token || id)) {
            const error = new Error("Please Log in to continue")
            error.status = 300
            return next(error)
        }
        const token = authorization.replace("Bearer ", "")

        jwt.verify(token, process.env.JWT_SECRET, async (error, payload) => {

            if (error) {
                if (error.message === "jwt expired") {
                    if (!refresh_token) {
                        return next({ message: "Please login to continue", status: 400 });
                    }
                    let tok_data = await token_model.findOne({
                        refresh_token: refresh_token,
                    })
                    if (!tok_data) {
                        return next({ message: "Please login to continue", status: 400 });
                    }
                    let user
                    if (tok_data.type === "Student") {
                        user = await user_model.findOne({ token: tok_data._id })
                    } else {
                        user = await admin_model.findOne({ token: tok_data._id })
                    }
                    if (!user) {
                        return next({ message: "Please login to continue", status: 400 });
                    }
                    
                    let newToken = tok_data.type === "Student" ?
                        generate_token({ _id: user._id, class: user.class, regNo: user.regNo, type: "Student" })
                        : generate_token({ type: "Admin", _id: user._id })
                    tok_data = await token_model.findOneAndUpdate(
                        { _id: tok_data._id },
                        { token: [...tok_data.token, { newToken, expiresIn: new Date(Date.now()).getHours() + 2 }] })
                    req.user = user;
                    req.token = newToken
                    req.refresh_token = refresh_token
                    req.type = tok_data.type
                    await tok_data.save()
                    await user.save();
                    return next();
                }
                else {
                    return next({ message: "Please login to continue", status: 400 });
                }
            } else {
                const { data } = payload
                let user;
                if (data.class) {
                    user = await user_model.findById({ _id: data._id })
                } else {
                    user = await admin_model.findById({ _id: data._id })
                }
                if (!user) {
                    return next({ message: "Please login to continue", status: 400 });
                }
                req.user = user;
                req._id = user._id;
                req.token = token
                req.refresh_token = refresh_token
                next()
            }
        })
    } catch (error) {
        if (!error.status) {
            error.status = 500;
        }
        res.status(error.status).json({ message: error.message });
    }
}


module.exports = Authorization