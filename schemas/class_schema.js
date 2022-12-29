const mongoose = require("mongoose")
const Schema = mongoose.Schema


const class_schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    students: [],
    class_teacher: {
        type: Schema.Types.ObjectId,
        ref: "Teacher"
    },
    exams: []
})

module.exports = class_schema
