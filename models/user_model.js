const mongoose = require("mongoose")
const user_schema = require("../schemas/user_schema")

//adding model for the user from the created schema
const user_model = mongoose.model("User", user_schema)

module.exports = user_model