const subject_model = require("../models/subject-model")
const exam_model = require("../models/exam-model")
const student_model = require("../models/user_model")
const { validationResult } = require("express-validator")
const multer = require("multer")
const question_model = require("../models/question-model")
const path = require("path")
const fs = require("fs")
const { deleteFile } = require("../utils/file")


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

const upload_question_image = multer({
    storage: fileStorage, fileFilter: fileFilter,
}).single("image");


const controller = {

    //all classes should be in capital letter as  well as subjects also 
    create_subject: async (req, res, next) => {
        try {
            //this create subject for a particluar class
            const { name } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }

            const subject = new subject_model({ name })
            await subject.save()
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(200).json({ message: error.message })
        }

    },
    create_exam: async (req, res, next) => {
        try {
            const { subjectId, class: exam_class, time } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }

            const exam = new exam_model({ subject: subjectId, class: exam_class, time })
            await exam.save()
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    //set question for the specified exam
    add_question: async (req, res, next) => {
        upload_question_image(req, res, async (error) => {
            try {
                const image = req.file
                const { exam_id, question, options, answer } = req.body
                if (!exam_id) {
                    const error = new Error("Please try again")
                    error.status = 500;
                    throw error
                }
                if (!options) {
                    const error = new Error("Option must be provided")
                    error.status = 500
                    throw error
                }
                if (!question && image) {
                    const error = new Error("instruction must be provided for the image")
                    error.status = 500
                    throw error
                }
                if (!answer) {
                    const error = new Error("Answer to the question must be provided")
                    error.status = 500
                    throw error
                }

                const questionVal = new question_model({
                    answers: options,
                    exam: exam_id,
                    image: image ? image.path : "",
                    correct_answer: answer,
                    question
                })
                await questionVal.save()
                await exam_model.updateOne({ _id: exam_id }, { $push: { questions: questionVal._id } })
                res.status(200).json({ refresh_token: req.refresh_token, token: req.token, })
            } catch (error) {
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
    },
    //delete a question if you don't need it
    delete_question: async (req, res, next) => {
        try {
            const { exam_id } = req.body
            const { id } = req.params
            const question = await question_model.findOne({ _id: id, exam: exam_id })
            if (!question) {
                return next({ message: "Please try again", status: 500 })
            }
            if (question.image) {
                const paths = path.join(process.cwd(), question.image)
                await deleteFile(paths)
            }
            await question_model.deleteOne({ _id: question._id })
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }

    },
    //get question
    get_question: async (req, res, next) => {
        try {
            const { id } = req.params
            const { exam_id } = req.body
            const question = await question_model.findOne({ exam_id, _id: id }).populate("exam")
            if (!question) {
                return next({ message: "please reload this question", status: 400 })
            }
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token, question })
        }
        catch (error) { }
    },
    //update any required question
    update_question: async (req, res, next) => {
        upload_question_image(req, res, async (error) => {
            try {
                const image = req.file
                const { id } = req.params
                const { exam_id, question, options, answer } = req.body
                const question_val = await question_model.findOne({ _id: id, exam: exam_id })
                if (!question_val) {
                    next({ message: "Please try again", status: 400 })
                }
                if (req.file && question_val.image) {
                    const paths = path.join(process.cwd(), question_val.image)
                    deleteFile(paths)
                }
                await question_model.updateOne(
                    { _id: question_val._id, exam: exam_id },
                    { image: image ? image.path : question_val.image, question, answers: options, correct_answer: answer }
                )
                res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
            }
            catch (error) {
                if (req.file) {
                    deleteFile(path.join(process.cwd(), req.file.path))
                }
                if (!error.status) {
                    error.status = 500
                }
                res.status(error.status).json({ message: error.message })
            }
        })
    },
    //delete any exam if not needed again
    delete_exam: async (req, res, next) => {
        try {
            const { id } = req.params
            const exam_val = await exam_model.findOne({ _id: id })
            if (!exam_val) {
                return next({ message: "Please try again", status: 400 })
            }
            const exam_question = await question_model.find({ _id: { $in: exam_val.questions } })
            for (values of exam_question) {
                const paths = path.join(process.cwd(), values.image)
                // deleteFile(paths)
                await question_model.findOneAndDelete({ _id: values._id })
            }
            await exam_model.findOneAndDelete({ _id: exam_val._id })
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    // this helps update a exam
    update_exam: async (req, res, next) => {
        try {
            const { id } = req.params
            const { class: std_class, time } = req.body
            const exam = await exam_model.findOne({ _id: id })
            if (!exam) {
                next({ message: "please try again", status: 400 })
            }
            await exam_model.updateOne({ _id: exam._id }, { class: std_class, time })
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    //this helps to get all the information about an exam
    get_exam_info: async (req, res, next) => {
        try {
            const { id } = req.params
            const exam = await exam_model.findOne({ _id: id }).populate("subject")
            // console.log(exam)
            if (!exam) {
                return next({ message: "please try again", status: 500 })
            }

            res.status(200).json({
                token: req.token,
                refresh_token: req.refresh_token,
                subject: exam.subject.name,
                class: exam.class,
                length: exam.questions.length,
                time: exam.time
            })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },

    //this helps to start an exam by fetching an exam
    start_exam: async (req, res, next) => {
        //the time gotton will be converted to minutes
        try {

            const { id } = req.params
            const exam = await exam_model.findOne({ _id: id }).populate("subject")
            const user = await student_model.findOne({ _id: req.user._id })
            if (!user) {
                return next({ message: "please try again", status: 400 })
            }
            const index = user.results.findIndex(el => el.exam.toString() === exam._id.toString())
            if (!(index < 0)) {
                return res.status(200).json({ token: req.token, refresh_token: req.refresh_token, message: "You have completed this test" })
            }
            if (user.class !== exam.class) {
                return res.status(200).json({ token: req.token, refresh_token: req.refresh_token, message: "Sorry, this exam is not meant for you" })
            }
            user.exam_active = true
            user.active_subject = exam.subject._id
            user.active_exam = exam._id
            user.time = exam.time
            const exam_questions = await question_model.aggregate([
                { $match: { exam: exam._id } },
                { $sample: { size: exam.questions.length } },
            ])
            const refactor_exam = exam_questions.map(el => ({
                _id: el._id,
                exam: el.exam,
                answer: el.correct_answer,
                my_answer: ""
            }))
            user.exams = refactor_exam
            await user.save()
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },

    //this help student get question 1
    get_student_question: async (req, res, next) => {
        try {
            const user = await student_model.findOne({ _id: req.user._id })
            const current_question_index = req.query.page ? +req.query.page : 1
            const prevent_question_index = current_question_index === 1 ? user.exams.length : current_question_index - 1
            const next_question_index = current_question_index === user.exams.length ? 1 : current_question_index + 1

            const cpx_exam = user.exams;

            const current_question = cpx_exam[current_question_index - 1]
            const full_question = await question_model.findOne({ _id: current_question._id }).select("-correct_answer")

            res.status(200).json({
                token: req.token,
                refresh_token: req.refresh_token,
                next: next_question_index,
                prev: prevent_question_index,
                current: current_question_index,
                question: full_question
            })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    //this helps to get all exams avaliable for a student
    get_student_exam: async (req, res, next) => {
        try {
            const user = await student_model.findById({ _id: req.user._id })
            if (!user) {
                return next({ message: "Please try again", status: 500 })
            }
            const exam_for_me = await exam_model.find({ class: user.class }).populate("subject")
            if (!exam_for_me) {
                return next({ message: "Please try again", status: 500 })
            }

            res.status(200).json({
                token: req.token,
                refresh_token: req.refresh_token,
                exams: exam_for_me
            })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(500).json({ message: error.message })
        }
    },
    //choose answer to question
    answer_question: async (req, res, next) => {
        try {
            const { id } = req.params
            const { answer, time } = req.body
            // console.log(answer, time)
            if (!answer) {
                return next({ message: "Please try again", status: "400" })
            }
            const user = await student_model.findOne({ _id: req.user._id })
            if (!user) {
                next({ message: "please try again", status: 500 })
            }
            user.time = time
            cpx_exam = user.exams
            cpx_exam.forEach(question => {
                if (question._id.toString() === id) {
                    question.my_answer = answer
                }
            });
            await student_model.updateOne({ _id: req.user._id }, { $set: { exams: cpx_exam, time: time } })
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },

    //All done and undone question
    get_all_exams: async (req, res, next) => {
        try {
            const user = await student_model.findOne({ _id: req.user._id })
            const cpx_exam = user.exams.map(el => ({ ...el, done: el.my_answer ? true : false }))
            res.status(200).json({ token: req.token, refresh_token: req.token, questions: cpx_exam })

        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },

    //this helps to submit question
    submit_question: async (req, res, next) => {
        try {
            const user = await student_model.findOne({ _id: req.user._id })
            const { id } = req.params
            const exam = await exam_model.findOne({ _id: id })
            if (!exam) {
                next({ message: "Please try again", status: 500 })
            }
            let score = 0
            for (let i = 0; i < user.exams.length; i++) {
                if (user.exams[i].my_answer === user.exams[i].answer) {
                    score += 1
                }
            }
            const result = [...user.results, { exam: exam._id, score }]
            const exam_scores = [...exam.scores, {
                name: req.user.firstname + " " + req.user.lastname,
                regNo: user.regNo,
                student_id: req.user._id,
                score
            }]
            await student_model.updateOne(
                { _id: req.user._id },
                {
                    exams: [],
                    results: result,
                    exam_active: false
                })
            await exam_model.updateOne({ _id: exam._id }, { scores: exam_scores })
            res.status(200).json({ token: req.token, refresh_token: req.token, })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }

    }


}

module.exports = controller