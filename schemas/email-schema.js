const mongoose = require("mongoose")
const Schema = mongoose.Schema

const email_schema = new Schema({
    email: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

module.exports = email_schema