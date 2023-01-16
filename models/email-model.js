const mongoose = require("mongoose")
const email_schema = require("../schemas/email-schema")

const email_model = mongoose.model("Email", email_schema)

module.exports = email_model