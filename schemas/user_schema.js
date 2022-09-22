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
    regNo: {
        required: true,
        type: String,
        unique: true
    },
    exams: [],
    results: []
})
module.exports = user_schema