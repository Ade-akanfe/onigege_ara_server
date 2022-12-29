const mongoose = require("mongoose")
const Schema = mongoose.Schema

const exam_schema = new Schema({
    subject: {
        type: Schema.Types.ObjectId,
        ref: "Subjects",
        required: true
    },
    class: [],
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
},{
    timestamps:true
})

module.exports = exam_schema