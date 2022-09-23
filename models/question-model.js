const mongoose = require("mongoose")
const question_schema = require("../schemas/question-schema")

const question_model = mongoose.model("Question", question_schema)
module.exports = question_model