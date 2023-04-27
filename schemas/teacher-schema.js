const mongoose = require("mongoose")
const Schema = mongoose.Schema

const teacher_schema = new Schema({
    firstname: {
        required: true,
        type: String
    },
    lastname: {
        required: true,
        type: String
    },
    gender: {
        type: String,
    },
    email: {
        required: true,
        type: String,
        unique: true
    },
    password: {
        required: true,
        type: String
    },  
    exams: {
        type: Schema.Types.ObjectId,
        ref: "Exam"
    },
    token: {
        type: Schema.Types.ObjectId,
        ref: "Token"
    },
    roles: [
        {
            type: String,
            enum: ["","CLASS TEACHER", "HOD"],
            default:""
        }
    ],
    students: [],
    class: {
        type: Schema.Types.ObjectId,
        ref: "StudentClass"
    },
    verified: {
        type: Boolean,
        default: false
    },
    subjects: [
        {
            subject: {
                type: Schema.Types.ObjectId,
                ref: "Subject"
            },
            class: {
                type: Schema.Types.ObjectId,
                ref: 'StudentClass'
            }
        }
    ],
    exams: [
        {
            subject: {
                type: Schema.Types.ObjectId,
                ref: "Subject"
            },
            classes: [{
                type: Schema.Types.ObjectId,
                ref: 'StudentClass'
            }],
            exam: {
                type: Schema.Types.ObjectId,
                ref: "Exam"
            }
        }
    ]
},{
    timestamps:true
})


module.exports = teacher_schema