const subject_schema = require("../schemas/subject-schema")
const mongoose = require("mongoose")


const subject_model = mongoose.model("Subjects", subject_schema)
module.exports = subject_model