const mongoose = require("mongoose")
const Schema = mongoose.Schema
const PostSchema = new Schema({
    title: {
        required: true,
        type: String
    },
    image: [],
    content: {
        required: true,
        type: String
    },
    likes: {
        type: Number
    },
    dislike: {
        type: Number
    },
}, {
    usetimestamps: true
})

module.exports = PostSchema