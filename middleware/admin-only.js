const admin_model = require("../models/admin-model")
const Admin = async (req, res, next) => {
    const user = await admin_model.findOne({ _id: req.user._id })
    if (!user) {
        return next({ message: "You're not allowed to perform this action" })
    }
    else {
        next()
    }
}

module.exports = Admin