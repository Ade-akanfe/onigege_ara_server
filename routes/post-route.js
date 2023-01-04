const express = require("express")
const { check } = require("express-validator")
const PostController = require("../controller/post-controller")
const Admin = require("../middleware/admin-only")
const Authorization = require("../middleware/auth")

const route = express.Router()

route.post("/new", Authorization, Admin, PostController.createPost)

route.get("/all", Authorization, Admin, PostController.readAllPost)

route.get("/user/all", PostController.AllPost)

route.get("/post/:id", PostController.readSinglePost)

route.get("/home/post", PostController.HomePagePost)

route.delete("/post/:id", Authorization, Admin, PostController.deleteSinglePost)

route.put("/post/:id", Authorization, Admin, PostController.editSinglePost)


module.exports = { post_route: route }