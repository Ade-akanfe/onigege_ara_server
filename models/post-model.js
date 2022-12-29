const PostSchema = require("../schemas/post-schema")
const mongoose = require("mongoose")


const post_model = mongoose.model("Post", PostSchema)

module.exports = post_model