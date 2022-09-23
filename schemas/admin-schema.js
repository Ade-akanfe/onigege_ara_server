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
    },
    token: {
        type: Schema.Types.ObjectId,
        ref: "Token",
        required: true
    }
}, {
    timestamps: true
})
module.exports = admin_schema