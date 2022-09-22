const mongoose = require("mongoose")

const Schema = mongoose.Schema;


//creating Schema for the user
const admin_schema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        required: true,
        type: String
    }
})
module.exports = admin_schema