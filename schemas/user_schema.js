const mongoose = require("mongoose")

const Schema = mongoose.Schema;


//creating Schema for the user
const user_schema = new Schema({
    firstname: {
        required: true,
        type: String
    },
    lastname: {
        required: true,
        type: String
    },
    middlename: {
        type: String
    },
    gender: {
        type: String
    },
    regNo: {
        required: true,
        type: String,
        unique: true
    },
    active_subject: {
        type: Schema.Types.ObjectId,
        ref: "Subject"
    },
    active_exam: {
        type: Schema.Types.ObjectId,
        ref: "Exam"
    },
    exams: [],
    exam_active: {
        type: Boolean,
        default: false
    },
    results: [],
    token: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Token"
    },
    class: {
        type: Schema.Types.ObjectId,
        ref: "StudentClass"
    },
    type: {
        type: String,
        required: true,
        default: "Student"
    },
    time: {
        type: String,
    },
    class_teacher: {
        type: Schema.Types.ObjectId,
        ref: "Teacher"
    }
}, {
    timestamps: true
})
module.exports = user_schema