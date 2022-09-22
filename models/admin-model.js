const mongoose = require("mongoose")
const admin_schema = require("../schemas/admin-schema")
const admin_model = mongoose.model("Admin", admin_schema)

module.exports = admin_model