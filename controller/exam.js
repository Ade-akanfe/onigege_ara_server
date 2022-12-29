const subject_model = require("../models/subject-model")
const exam_model = require("../models/exam-model")
const student_model = require("../models/user_model")
const { validationResult } = require("express-validator")
const multer = require("multer")
const question_model = require("../models/question-model")
const path = require("path")
const fs = require("fs")
const { deleteFile } = require("../utils/file")
const class_model = require("../models/class_model")
const teacher_model = require("../models/teacher-model")
const createExcelFile = require("../utils/convert")
const mime = require("mime")
const ApiFeatures = require("../utils/sort")



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

    //This route helps to create class for Student and Teachers
    createClass: async (req, res, next) => {
        try {
            const { name } = req.body
            let class_doc = await class_model.findOne({ name: name.toUpperCase() })
            if (class_doc) {
                return next({ message: "Please choose another name, class already exist" })
            }
            class_doc = new class_model({ name: name.toUpperCase() })
            await class_doc.save()
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    //all classes should be in capital letter as  well as subjects also 
    create_subject: async (req, res, next) => {
        try {
            //this create subject for a particluar class
            const { name: nameVal } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }

            const subject = new subject_model({ name: nameVal.toUpperCase() })
            await subject.save()
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(200).json({ message: error.message })
        }

    },
    //the subjects will be a drop down for the student
    create_exam: async (req, res, next) => {
        try {
            const { subjectId, class: exam_class, time } = req.body
            const errors = validationResult(req)
            let teacher;
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            if (req.type === "Teacher") {

                teacher = await teacher_model.findOne({ _id: req.user._id })
                const isThere = teacher.subjects.find(el => {
                    return (el.subject.toString() === subjectId.toString())
                })
                if (!isThere) {
                    return next({ message: "You're not allowed to perform this request" })
                }
            }

            const exam = new exam_model({ subject: subjectId, class: exam_class, time })
            if (req.type === 'Teacher') {
                await teacher_model.updateOne({ _id: teacher._id },
                    { $push: { exams: [{ subject: subjectId, exam: exam._id, classes: exam_class }] } })
            }
            await class_model.updateMany({ _id: { $in: exam_class } }, { $push: { exams: exam._id } })
            await exam.save()
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    //this route help teacher to create exams for only their subjects
    by_subject: async (req, res, next) => {
        try {
            const teacher = await teacher_model.findOne({ _id: req.user._id })
            if (!teacher) {
                return next({ message: "please try again", status: 500 })
            }
            const result = teacher.subjects.map(async (el) => {
                const subject_name = await subject_model.findOne({ _id: el.subject }).select("name")
                const class_name = await class_model.findOne({ _id: el.class }).select("name")
                return {
                    name: subject_name,
                    class: class_name
                }
            })
            const fins = await Promise.all(result)

            res.status(200).json({ token: req.token, refresh_token: req.refresh_token, subjects: fins })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    //set question for the specified exam
    add_question: async (req, res, next) => {
        upload_question_image(req, res, async (err) => {
            try {
                if (err instanceof multer.MulterError) {
                    const errorMsg = { message: err.message, status: 500 }
                    return next(errorMsg)
                } else if (err) {
                    const errorMsg = { message: err.message, status: 500 }
                    return next(errorMsg)
                } else {
                    const image = req.file
                    const { exam_id, question, options, answer } = req.body
                    const newVal = options.split(",")

                    const exam_val = await exam_model.findOne({ _id: exam_id })
                    if (req.type === "Teacher") {
                        const teacher = await teacher_model.findOne({ _id: req.user._id })
                        const isThere = teacher.subjects.find(el => {

                            return el.subject.toString() === exam_val.subject.toString()
                        })
                        if (!isThere) {
                            return next({ message: "You're not allowed to perform this request" })
                        }
                    }
                    if (!exam_id) {
                        const error = new Error("Please try again")
                        error.status = 500;
                        throw error
                    }
                    if (!newVal) {
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

                    const answers = newVal.map(el => el.toUpperCase())

                    const questionVal = new question_model({
                        answers: answers,
                        exam: exam_id,
                        image: image ? image.path : "",
                        correct_answer: answer.toUpperCase(),
                        question
                    })
                    await questionVal.save()
                    await exam_model.updateOne({ _id: exam_id }, { $push: { questions: questionVal._id } })
                    const exam = await exam_model.findOne({ _id: exam_id }).select("questions")
                    res.status(200).json({ refresh_token: req.refresh_token, token: req.token, length: exam.questions.length })
                }
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
        catch (error) {
            res.statue(error.status ? error.status : 500).json({ message: error.message })
        }
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
            if (req.type === "Teacher") {
                const teacher = await teacher_model.findOne({ _id: req.user._id })
                const isThere = teacher.subjects.find(el => {
                    return (el.subject.toString() === exam_val.subject.toString())
                })
                if (!isThere) {
                    return next({ message: "You're not allowed to perform this request" })
                }
            }
            const exam_question = await question_model.find({ _id: { $in: exam_val.questions } })
            for (values of exam_question) {
                const paths = path.join(process.cwd(), values.image)
                deleteFile(paths)
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
            if (req.type === "Teacher") {
                const teacher = await teacher_model.findOne({ _id: req.user._id })
                const isThere = teacher.subjects.find(el => {
                    return (el.subject.toString() === exam.subject.toString())
                })
                if (!isThere) {
                    return next({ message: "You're not allowed to perform this request" })
                }
            }
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
            const classes = await class_model.find({ _id: { $in: exam.class } }).select("name")
            if (!exam) {
                return next({ message: "please try again", status: 500 })
            }

            res.status(200).json({
                token: req.token,
                refresh_token: req.refresh_token,
                subject: exam.subject.name,
                class: classes,
                length: exam.questions.length,
                time: exam.time,
                exam_id: id
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

            if (user.exam_active) {
                if (id.toString() != user.active_exam) {
                    return res.status(200).json({
                        token: req.token,
                        refresh_token: req.refresh_token,
                        message: "You have an ongoing exam, complete to continue"
                    })
                }
            }

            if (!user) {
                return next({ message: "please try again", status: 400 })
            }
            const index = user.results.findIndex(el => el.exam.toString() === exam._id.toString())
            if (!(index < 0)) {
                return res.status(200).json({ token: req.token, refresh_token: req.refresh_token, message: "You have completed this test" })
            }

            const is_not_yours = exam.class.find(el => user.class.toString() !== exam.class)
            if (!is_not_yours) {
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
    //this route helps teacher get the neccessary exam
    teacher_exam: async (req, res, next) => {
        try {
            const { id } = req.params
            const exam_question = await exam_model.findOne({ _id: id }).populate("subject")
            if (!exam_question) {
                return next({ message: "Not found", status: 404 })
            }
            const exam_class = await class_model.find({ _id: { $in: exam_question.class } }).select("name")
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token, id: req.user._id, class: exam_class, exam: exam_question })

        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    //this helps to get all exam
    getAllExamByATeacher: async (req, res, next) => {
        try {
            const teacher = await teacher_model.findOne({ _id: req.user._id })
            const exam_id = teacher.exams.map(el => el.exam)
            const values = await exam_model.find({ _id: { $in: exam_id } }).populate("subject").sort({ createdAt: -1 })
            const sortedVal = values.map(async (el) => {
                const classes = await class_model.find({ _id: { $in: el.class } }).select("name")
                return {
                    exam_id: el._id,
                    subject: el.subject.name,
                    class: classes,
                    time: el.time,
                    length: el.questions.length
                }
            })

            const result = await Promise.all(sortedVal)

            res.status(200).json({ token: req.token, refresh_token: req.refresh_token, result })
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
            const prevent_question_index = current_question_index === 1 ? null : current_question_index - 1
            const next_question_index = current_question_index === user.exams.length ? null : current_question_index + 1


            const cpx_exam = user.exams;
            console.log(user)
            console.log(cpx_exam)
            const current_question = cpx_exam[current_question_index - 1]
            
            console.log(current_question)
            const full_question = await question_model.findOne({ _id: current_question._id }).select("-correct_answer")


            res.status(200).json({
                token: req.token,
                refresh_token: req.refresh_token,
                next: next_question_index,
                prev: prevent_question_index,
                current: current_question_index,
                question: full_question,
                done: `${current_question_index}/${cpx_exam.length}`,
                answer: current_question.my_answer
            })
        }
        catch (error) {
            console.log(error)
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
            const exam_for_me = await exam_model.find({ class: { $elemMatch: { $eq: user.class.toString() } } })
                .populate("subject").select("-questions").select("-class").select("-scores").select("-time")

            const filteredResult = exam_for_me.filter((el) => {
                return user.results.every(result => {
                    return result.exam.toString() !== el._id.toString()
                })
            })

            if (!filteredResult) {
                return next({ message: "Please try again", status: 500 })
            }
            res.status(200).json({
                token: req.token,
                refresh_token: req.refresh_token,
                exams: filteredResult
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
            let { answer, time } = req.body


            if (!answer) {
                answer = ""
            }
            const user = await student_model.findOne({ _id: req.user._id })
            if (!user) {
                next({ message: "please try again", status: 500 })
            }
            user.time = time
            cpx_exam = user.exams
            const result = cpx_exam.map(question => {
                if (question._id.toString() === id) {
                    question.my_answer = answer
                }
                return { ...question }
            });

            await student_model.updateOne({ _id: req.user._id }, { $set: { exams: result, time: time } })
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
            const cpx_exam = user.exams.map((el, index) => ({ index: index + 1, done: el.my_answer ? true : false }))
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
                return next({ message: "Please try again", status: 500 })
            }
            if (!user.exam_active || !user.active_exam) {
                return next({ message: "Not allowed", status: 500 })
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
                    exam_active: false,
                    results: result,
                    $unset: {
                        exams: [],
                        active_exam: "",
                        active_subject: "",
                        time: ""
                    }
                })
            await exam_model.updateOne({ _id: exam._id }, { scores: exam_scores })
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token, })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }

    },
    // this route will be used by class teachers to get all the school student result
    get_class_result: async (req, res, next) => {
        try {
            const { class_id } = req.body
            let teacher = await teacher_model.findOne({ _id: req.user._id });
            if (req.type === "Teacher") {
                const isThere = teacher.roles.find(el => {
                    return (el === "CLASS TEACHER")
                })
                if (!isThere) {
                    return next({ message: "You're not allowed to perform this request" })
                }

                if (teacher.class.toString() !== class_id) {
                    return next({ message: "You're not allowed to perform this request" })
                }
            }
            const class_val = await class_model.findOne({ _id: class_id })
            const class_result = await student_model.find({ _id: { $in: class_val.students } }).select("results")


            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },


    //this help subject teacher for a class get the student result 
    get_exam_result_class: async (req, res, next) => {
        try {
            const { exam_id, classes } = req.body
            const exam = await exam_model.findOne({ _id: exam_id, class: { $in: classes } })

            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },

    //this helps Admin or class teacher get student result
    get_student_result: async (req, res, next) => {
        try {
            const { id } = req.params
            const user = await student_model.findOne({ _id: id })
            if (!user) { return next({ message: "Student data not found" }) }
            const data_val = user.results.map(async (el) => {
                const exam_val = await exam_model.findOne({ _id: el.exam }).populate("subject")
                return {
                    subject: exam_val.subject.name,
                    score: el.score,
                    class: req.user.class
                }
            })
            const result = await Promise.all(data_val)
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token, result })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },

    // this helps to get Student that wrote an exam
    get_exam_student: async (req, res, next) => {
        try {
            const { id } = req.params

            const exam_details = await exam_model.findOne({ _id: id })

            if (!exam_details) {
                return next({ message: "Pleaset try again", status: 400 })
            }
            const allStudents = exam_details.scores

            const updatedStudents = allStudents.map(async (el) => {
                const std = await student_model.findOne({ _id: el.student_id }).populate("class")
                return {
                    ...el,
                    class: std.class.name
                }
            })
            const result = await Promise.all(updatedStudents)
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token, result })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },

    //download exatm results in excel format
    download_exam_result: async (req, res, next) => {
        try {
            const { id } = req.params

            const exam_details = await exam_model.findOne({ _id: id }).populate("subject")
            if (!exam_details) {
                return next({ message: "Pleaset try again", status: 400 })
            }
            const allStudents = exam_details.scores

            const updatedStudents = allStudents.map(async (el) => {
                const std = await student_model.findOne({ _id: el.student_id }).populate("class")
                return {
                    firstname: el.name.split(" ")[0],
                    lastname: el.name.split(" ")[1],
                    score: el.score.toString(),
                    regNo: el.regNo,
                    class: std.class.name
                }
            })
            const result = await Promise.all(updatedStudents)
            createExcelFile(exam_details.subject.name, result)
            const filepath = path.join(__dirname, "../", exam_details.subject.name + ".xlsx")
            const fileName = path.basename(filepath)
            const mimeType = mime.getType(filepath)
            res.setHeader("Content-Disposition", "attachment;filename=" + fileName)
            res.setHeader("Content-Type", mimeType)
            setTimeout(() => {
                const isThere = fs.existsSync(filepath)

                if (isThere) {
                    res.download(filepath)
                }
            }, 2000)

        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    //re-assign exam for students
    re_assign_exam: async (req, res, next) => {
        try {
            let { id } = req.params
            const { student_id } = req.body


            const exam_data = await exam_model.findOne({ _id: id })
            const std = await student_model.findOne({ _id: student_id })
            if (!exam_data || !std) {
                return next({ message: "Please try again", status: 400 })
            }
            const stdResult = std.results
            const exam_result = exam_data.scores

            const filtered_exam_result = exam_result.filter(el => {
                return el.student_id.toString() !== student_id.toString()
            })
            const filtered_student_result = stdResult.filter(el => {
                return (el.exam.toString() !== id.toString())
            })

            await student_model.updateOne({ _id: std._id }, { $set: { results: filtered_student_result } })
            await exam_model.updateOne({ _id: id }, { $set: { scores: filtered_exam_result } })
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error).json({ message: error.message })
        }
    },

    get_student_by_class: async (req, res, next) => {
        try {
            const { page, limit, name: nameval, class: classval } = req.query
            let currentIndex
            let features
            let query;
            let documents;
            if (!nameval && !classval) {
                documents = await student_model.countDocuments()
                let currentNumber = (page ? page : 1) * (limit ? limit : 5)
                currentIndex = currentNumber > documents ? documents : currentNumber
                features = new ApiFeatures(student_model.find().populate("class"), req.query).filtering().sorting().pagination();
                query = await features.query;
            } else {
                features = new ApiFeatures(student_model.find({
                    $or:
                        [
                            { "firstname": { $regex: `${nameval}`, $options: "i" } },
                            { "lastname": { $regex: `${nameval}`, $options: 'i' } },
                            { "class": classval }
                        ]
                }).populate("class"), req.query).filtering().sorting().pagination();
                query = await features.query;
                documents = query.length
                let currentNumber = (page ? page : 1) * (limit ? limit : 5)
                currentIndex = currentNumber > documents ? documents : currentNumber
            }
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token, students: query, id: req.user._id, currentNumber: currentIndex, allStudents: documents })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    allClass: async (req, res, next) => {
        try {
            const all_classes = await class_model.find().select("name")
            res.status(200).json({ class: all_classes, token: req.token, refresh_token: req.refresh_token })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    get_all_subjects: async (req, res, next) => {
        try {
            const subjects = await subject_model.find()
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token, subjects })
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