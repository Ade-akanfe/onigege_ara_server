const { validationResult } = require("express-validator")
const email_model = require("../models/email-model")
const { SendResetEmail: sendMail, feedback } = require("../utils/mail")
const mime = require("mime")
const multer = require("multer")
const fs = require("fs")
const path = require("path")





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

const upload_image = multer({
    storage: fileStorage, fileFilter: fileFilter,
}).single("image");


const controller = {
    subscribe: async (req, res, next) => {
        try {
            const { email } = req.body
            const result = validationResult(req)
            if (!result.isEmpty()) {
                let error = result.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            let emailVal = await email_model.findOne({ email })
            if (emailVal) {
                return res.status(200).json({ message: "You are a subscriber already" })
            }
            emailVal = new email_model({ email })
            await emailVal.save()
            res.status(200).json({ message: "successfully subscribed" })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    unsubscribe: async (req, res, next) => {
        try {
            const { email } = req.body
            const result = validationResult(req)
            if (!result.isEmpty()) {
                let error = result.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            let emailVal = await email_model.findOne({ email })
            if (!emailVal) {
                return res.status(200).json({ message: "You are not a subscriber" })
            }
            await email_model.deleteOne({ email })
            res.status(200).json({ message: "You have unsubscribed successfully" })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    sendDirectMessage: async (req, res, next) => {
        try {
            const { email, message, name: nameVal } = req.body
            const result = validationResult(req)
            if (!result.isEmpty()) {
                let error = result.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            await sendMail(email, nameVal, message)
            res.status(200).json({ message: "Thanks for your feedback" })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    sendUpdatees: async (req, res, next) => {
        upload_image(req, res, async (err) => {
            try {
                if (err instanceof multer.MulterError) {
                    const errorMsg = { message: err.message, status: 500 }
                    return next(errorMsg)
                } else if (err) {
                    const errorMsg = { message: err.message, status: 500 }
                    return next(errorMsg)
                } else {
                    const { title, message } = req.body
                    const image = req.file
                    const result = validationResult(req)
                    if (!result.isEmpty()) {
                        let error = result.errors[0].msg;
                        return next({ message: error, status: 400 });
                    }

                    const subscribers = await email_model.find().select("email")
                    const promise = subscribers.forEach(async (element) => {
                        await feedback({ email: element, title, message, src: image.pathname })
                    })
                    const results = await Promise.all(promise)
                    res.status(200).json({ message: "Message sent" })
                }
            }
            catch (error) {
                if (!error.status) {
                    error.status = 500
                }
                if (req.file) {
                    const paths = path.join(process.cwd(), req.file.path)
                    deleteFile(paths)
                }
                if (!error.status) {
                    error.status = 500
                }
                res.status(error.status).json({ message: error.message })
            }
        })
    }
}


module.exports = controller