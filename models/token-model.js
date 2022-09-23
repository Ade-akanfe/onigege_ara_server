const mongoose = require("mongoose")
const token_schema = require("../schemas/token-schema")

const token_model = mongoose.model("Token", token_schema)

module.exports = token_model