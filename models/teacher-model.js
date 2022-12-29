const mongoose = require("mongoose")
const teacher_schema = require("../schemas/teacher-schema")

const teacher_model = mongoose.model("Teacher", teacher_schema)
module.exports = teacher_model