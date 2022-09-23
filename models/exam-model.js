const mongoose = require("mongoose")
const exam_schema = require("../schemas/exam-schema")

const exam_model = mongoose.model("Exam", exam_schema)

module.exports = exam_model