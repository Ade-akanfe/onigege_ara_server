const mongoose = require("mongoose")
const Schema = mongoose.Schema

const token_schema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    token: [],
    refresh_token: {
        type: String,
        required: true
    },
    type: {
        required: true,
        type: String
    }
}, {
    timestamps: true
})
module.exports = token_schema