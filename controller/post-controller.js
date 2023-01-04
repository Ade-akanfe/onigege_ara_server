const post_model = require("../models/post-model");
const path = require("path")
const ApiFeatures = require("../utils/sort")
const { validationResult } = require("express-validator")
const multer = require("multer")
const { deleteFile } = require("../utils/file")
const fs = require("fs")


const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "public";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    if (!file.mimetype.includes("image")) {
        const error = new Error("Can't upload, only image allowed");
        error.status = 405;
        cb(error, false);
    }
    cb(null, true);
};

const upload_post_image = multer({
    storage: fileStorage, fileFilter: fileFilter,
}).single("image");

const PostController = {
    createPost: async (req, res, next) => {
        upload_post_image(req, res, async (err) => {
            try {
                if (err instanceof multer.MulterError) {
                    const errorMsg = { message: err.message, status: 500 }
                    return next(errorMsg)
                } else if (err) {
                    const errorMsg = { message: err.message, status: 500 }
                    return next(errorMsg)
                } else {
                    const image = req.file
                    const { content, title } = req.body
                    console.log(req.body)
                    const errors = validationResult(req)
                    if (!title) {
                        return next({ message: "All fields are required", status: 500 })
                    }
                    if (!content) {
                        return next({ message: "All fields are required", status: 500 })
                    }
                    const post = new post_model({
                        content: content.trim(),
                        image: image ? image : "",
                        title: title.trim()
                    })
                    await post.save()
                    res.status(200).json({ token: req.token, refresh_token: req.refresh_token, id: req.user._id })
                }
            }
            catch (error) {
                if (req.files) {
                    req.files.forEach(el => {
                        const paths = path.join(process.cwd(), el.path)
                        deleteFile(paths)
                    })
                }
                if (!error.status) {
                    error.status = 500
                }
                res.status(error.status).json({ messsage: error.message })
            }
        })
    },
    AllPost: async (req, res, next) => {
        try {
            const { page, title } = req.query
            const pageNumber = parseInt(page)
            let currentIndex
            let features
            let query;
            let documents;
            if (!title) {
                documents = await post_model.countDocuments()
                let currentNumber = (page ? page : 1) * (5)
                currentIndex = currentNumber > documents ? documents : currentNumber
                features = new ApiFeatures(post_model.find(), req.query).filtering().sorting().pagination();
                query = await features.query;
            } else {
                documents = await post_model.countDocuments({ title: { $regex: title, $options: "i" } })
                query = await post_model.find({ title: { $regex: title, $options: "i" } }).skip(pageNumber - 1).limit(5)
                let currentNumber = (page ? page : 1) * (5)
                currentIndex = currentNumber > documents ? documents : currentNumber
            }
            res.status(200).json({ posts: query, currentNumber: currentIndex, allPosts: documents })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    readAllPost: async (req, res, next) => {
        try {
            const { page, limit, title } = req.query
            let currentIndex
            let features
            let query;
            let documents;
            if (!title) {
                documents = await post_model.countDocuments()
                let currentNumber = (page ? page : 1) * (limit ? limit : 5)
                currentIndex = currentNumber > documents ? documents : currentNumber
                features = new ApiFeatures(post_model.find(), req.query).filtering().sorting().pagination();
                query = await features.query;
            } else {
                features = new ApiFeatures(post_model.find({
                    $or:
                        [
                            { "title": { $regex: `${title}`, $options: "i" } },
                        ]
                }), req.query).filtering().sorting().pagination();
                query = await features.query;
                documents = query.length
                let currentNumber = (page ? page : 1) * (limit ? limit : 5)
                currentIndex = currentNumber > documents ? documents : currentNumber
            }
            res.status(200).json({ students: query, currentNumber: currentIndex, allPosts: documents })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    readSinglePost: async (req, res, next) => {
        const { id } = req.params
        try {
            const post = await post_model.findOne({ _id: id })
            if (!post) {
                return next({ message: "Post not found", status: 400 })
            }
            const similarPost = await post_model.find({ _id: { $ne: id } })
            res.status(200).json({ post, similarPost })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    editSinglePost: async (req, res, next) => {
        try {
            const { content, title } = req.body
            const { id } = req.params
            const post = await post_model.findOne({ _id: id })
            if (!post) {
                return next({ message: error.message, status: 400 })
            }
            await post_model.updateOne({ _id: id }, { $set: { content: content.trim(), title: title.trim() } })
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token,id:req.user._id })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }

    },
    deleteSinglePost: async (req, res, next) => {
        try {
            const { id } = req.params
            const post = await post_model.findOne({ _id: id })
            if (!post) {
                return next({ message: error.message, status: 400 })
            }
            await post_model.deleteOne({ _id: id })
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    likePost: async (req, res, next) => {
        try {
            const { id } = req.params
            const post = await post_model.findOne({ _id: id })
            if (!post) {
                return next({ message: error.message, status: 400 })
            }
            await post_model.updateOne({ _id: id }, { $set: { likes: post.likes + 1 } })
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    dislikePost: async (req, res, next) => {
        try {
            const { id } = req.params
            const post = await post_model.findOne({ _id: id })
            if (!post) {
                return next({ message: error.message, status: 400 })
            }
            await post_model.updateOne({ _id: id }, { $set: { dislike: post.dislike + 1 } })
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    HomePagePost: async (req, res, next) => {
        try {
            const posts = await post_model.find().limit(2).sort("createdAt")
            res.status(200).json({ posts })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    }
}
module.exports = PostController