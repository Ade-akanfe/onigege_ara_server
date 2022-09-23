const mongoose = require("mongoose")
const Schema = mongoose.Schema

const subject_schema = new Schema({
    name: {
        type: String,
        require: true,
        unique: true
    }
}, {
    timestamps: true
})

module.exports = subject_schema