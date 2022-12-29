const express = require("express")
const { check } = require("express-validator")
const PostController = require("../controller/post-controller")
const Admin = require("../middleware/admin-only")
const Authorization = require("../middleware/auth")

const route = express.Router()

route.post("/new", Authorization, Admin, PostController.createPost)

route.get("/all", Authorization, Admin, PostController.readAllPost)

module.exports = { post_route: route }