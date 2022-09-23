const mongoose = require("mongoose")
const Schema = mongoose.Schema

const exam_schema = new Schema({
    subject: {
        type: Schema.Types.ObjectId,
        ref: "Subjects",
        required: true
    },
    class: {
        type: String,
        required: true
    },
    questions: [
        {
            type: Schema.Types.ObjectId,
            ref: "Question"
        }
    ],
    time: {
        type: String,
        required: true
    },
    scores: []
})

module.exports = exam_schema