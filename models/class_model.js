const mongoose = require("mongoose")
const class_schema = require("../schemas/class_schema")

const class_model = mongoose.model("StudentClass", class_schema)

module.exports = class_model