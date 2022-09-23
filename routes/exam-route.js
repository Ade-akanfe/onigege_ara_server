const express = require("express")
const { check } = require("express-validator")
const Admin = require("../middleware/admin-only")
const Authorization = require("../middleware/auth")
const exam_controller = require("../controller/exam")
const subject_model = require("../models/subject-model")
const exam_model = require("../models/exam-model")


const route = express.Router()


// create a subject
//all Subject must be converted to capital letter
route.post("/new/subject", [
    check("name").notEmpty().withMessage("Please Enter subject name")
        .custom(async (value, { req }) => {
            isThere = await subject_model.findOne({ name: value })
            if (isThere) {
                const error = new Error("Subject already exist")
                error.status = 400
                throw error
            }
            return true
        })
], Authorization, Admin, exam_controller.create_subject)



//create an Exam for a subject with class 
route.post("/new/exam", [
    check("class").notEmpty().withMessage("Please Enter Class for the Exam"),
    check("subjectId").notEmpty().withMessage("Please Pick subject for this exam")
], Authorization, Admin, exam_controller.create_exam)


// this route delete an exam and the questions in it
route.delete("/remove/:id", Authorization, Admin, exam_controller.delete_exam)

// this route update exam
route.put("/update/:id", Authorization, Admin, exam_controller.update_exam)

//this route set the question for an exam
route.post("/set/question", Authorization, Admin, exam_controller.add_question)

//this route gets questions for editing
route.get("/question/:id", Authorization, exam_controller.get_question)

// this section delete already set questions
route.delete("/question/:id", Authorization, Admin, exam_controller.delete_question)

//this section update already set question
route.put("/question/:id", Authorization, Admin, exam_controller.update_question)

//this route help to get student exam
route.get("/student/question", Authorization, exam_controller.get_student_exam)



//this route helps student start exam
route.get("/start/:id", Authorization, exam_controller.start_exam)

//this route help to get a question for student to answer
// the id is the id of the first pages that first question in the array
route.get("/student/question/:id", Authorization, exam_controller.get_student_question)

//this route helps to get info about an exam
route.get("/info/:id", Authorization, exam_controller.get_exam_info)


//this route helps to pick answer to question
route.put("/answer/:id", Authorization, exam_controller.answer_question)

//this route helps to check for all done and undone questions
route.get("/complete/exam", Authorization, exam_controller.get_all_exams)

//this helps to submit questions
//id is the exam id
route.get("/submit/:id", Authorization, exam_controller.submit_question)

// this route help student fetch result


module.exports = route