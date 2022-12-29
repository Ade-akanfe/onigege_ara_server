const admin_model = require("../models/admin-model")
const teacher_model = require("../models/teacher-model")


const teacher_admin = async (req, res, next) => {
    let user;
    if (req.type === "Admin") {
        user = await admin_model.findOne({ _id: req.user._id });
    } else if (req.type === "Teacher") {
        user = await teacher_model.findOne({ _id: req.user._id });
        if (!user.verified) {
            return next({ message: "Please Verify your account from the Admin" })
        }
    }


    if (!user) {
        return next({ message: "You're not allowed to perform this action" })
    }
    else {
        next()
    }
}

module.exports = teacher_admin