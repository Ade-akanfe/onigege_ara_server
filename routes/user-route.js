const express = require("express")
const { check } = require("express-validator")
const user_controller = require("../controller/user")
const Authorization = require("../middleware/auth")

//creating the Router
const route = express.Router()
const admin_model = require("../models/admin-model")
const student_model = require("../models/user_model")
const teacher_model = require("../models/teacher-model")
const { decrypt_password } = require("../utils/helper")
const Admin = require("../middleware/admin-only")
const teacher_admin = require("../middleware/admin+teacher")

route.post("/register", [
    check("regNo").notEmpty().withMessage("Registration Number is Required")
        .custom(async (value, { req }) => {
            const isThere = await student_model.findOne({ regNo: value })
            if (isThere) {
                const error = new Error("Registration Number already exist please try a new one")
                error.status = 500
                throw error
            }
            return true
        }),
    check("firstname").notEmpty().withMessage("Student First Name is Required"),
    check("lastname").notEmpty().withMessage("Student Last Name is Required"),
    check("class").notEmpty().withMessage("Student Class is required"),
], Authorization, Admin, user_controller.student_signup)

route.post("/login", [
    check("regNo").notEmpty().withMessage("Registration Number is Required")
], user_controller.student_signin)

//this route help teachers to register and sign_up


route.post("/teacher/register", [
    check("email").notEmpty().withMessage("email field cannot be empty")
    .isEmail().withMessage("Please Enter valid Email Address")
        .custom(async (value, { req }) => {
            let isThere;
            isThere = await teacher_model.findOne({ email: value })
            if (isThere) {
                const error = new Error("Email already exist please try a new one")
                error.status = 500
                throw error
            } else {
                isThere = await teacher_model.findOne({ email: value })
                if (isThere) {
                    const error = new Error("Email already exist please try a new one")
                    error.status = 500
                    throw error
                }
            }
            return true
        }),
    check("password")
        .notEmpty()
        .withMessage("Password field is required")
        .isLength({ min: 8 })
        .withMessage("Password too short")
        .isStrongPassword()
        .withMessage(
            "Password must contain a special character, a capital letter and greater than 8 characters"
        ),
    check("firstname").notEmpty().withMessage("First name is required"),
    check("lastname").notEmpty().withMessage("Last name is required")
], user_controller.teacher_signup)

route.post("/teacher/login", [
    check("email").notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please Enter valid Email Address")
        .custom(async (value, { req }) => {
            const user = await teacher_model.findOne({ email: value })
            if (!user) {
                const error = new Error("Incorrect Email or Password")
                error.status = 500;
                throw error
            }
            return true
        }),
    check("password").notEmpty().withMessage("Password is required")
        .custom(async (value, { req }) => {
            const user = await teacher_model.findOne({ email: req.body.email })
            if (!user) {
                const error = new Error("Incorrect Email or Password")
                error.status = 500;
                throw error
            }
            const isSame = await decrypt_password(value, user.password)
            if (!isSame) {
                const error = new Error("Incorrect Email or Password")
                error.status = 500;
                throw error
            }
            return true
        })
], user_controller.teacher_login)


route.post("/admin/register", [
    check("email").notEmpty().withMessage("email field cannot be empty")
    .isEmail().withMessage("Please Enter valid Email Address")
        .custom(async (value, { req }) => {
            let isThere
            isThere = await admin_model.findOne({ email: value })
            if (isThere) {
                const error = new Error("Email already exist please try a new one")
                error.status = 500
                throw error
            } else {
                isThere = await teacher_model.findOne({ email: value })
                if (isThere) {
                    const error = new Error("Email has already been takn by a teacher, use a new one")
                    error.status = 500
                    throw error
                }
            }
            return true
        }),
    check("password")
        .notEmpty()
        .withMessage("Password field is required")
        .isLength({ min: 8 })
        .withMessage("Password too short")
        .isStrongPassword()
        .withMessage(
            "Password must contain a special character, a capital letter and greater than 8 characters"
        )
], user_controller.admin_signup)

route.post("/admin/login", [
    check("email").notEmpty().withMessage("Email is required")
        .custom(async (value, { req }) => {
            const user = await admin_model.findOne({ email: value })
            if (!user) {
                const error = new Error("Incorrect Email or Password")
                error.status = 500;
                throw error
            }
            return true
        }),
    check("password").notEmpty().withMessage("Password is required")
        .custom(async (value, { req }) => {
            const user = await admin_model.findOne({ email: req.body.email })
            if (!user) {
                const error = new Error("Incorrect Email or Password")
                error.status = 500;
                throw error
            }
            const isSame = await decrypt_password(value, user.password)
            if (!isSame) {
                const error = new Error("Incorrect Email or Password")
                error.status = 500;
                throw error
            }
            return true
        })
], user_controller.admin_signin)

// this route helps to update student data
route.put("/update/:id", [
    [
        check("regNo").notEmpty().withMessage("Registration Number is Required")
            .custom(async (value, { req }) => {
                const isThere = await student_model.findOne({ regNo: value })
                if (isThere) {
                    const error = new Error("Registration Number already exist please try a new one")
                    error.status = 500
                    throw error
                }
                return true
            }),
        check("firstname").notEmpty().withMessage("Student First Name is Required"),
        check("lastname").notEmpty().withMessage("Student Last Name is Required"),
        check("class").notEmpty().withMessage("Student Class is required")
    ]
], Authorization, Admin, user_controller.update_student)


//this route get the student detail on allowed by Teacher and Admin
route.get("/student/:id", Authorization, user_controller.fetch_student),


    //this route help get he student remaining time during exam
    route.get("/time", Authorization, user_controller.time_left_student)

//this route get the teacher detail on allowed by  Admin
route.get("/teacher/:id", Authorization, teacher_admin, user_controller.fetch_teacher)

//this route helps Admin to assign role to Teacher
route.put('/teacher/:id', Authorization, Admin, user_controller.assign_roles)

//this route will help teacher add subject
// the Id here can be anyone 
route.put("/teacher/update/:id", Authorization, teacher_admin, user_controller.update_teacher)

// fetch teacher subject for teacher to create exam with
route.get("/subject/teacher", Authorization, teacher_admin, user_controller.fetch_teacher_subject)

//update teacher, by teacher him self
route.put("/me/update/teacher", Authorization, teacher_admin, user_controller.updateSelf)

//this route helps remove role from the teacher 
route.put('/teacher/remove/:id', Authorization, Admin, user_controller.remove_role)

//this route helps to assign class to class teachers and co
route.put("/teacher/assign/:id", Authorization, Admin, user_controller.assign_class)



//this roues helps to fetch student onlya allowed by HODs, ClassTeacher role and Admin
//the id here is the class Id
route.get("/class/student/:id", Authorization, teacher_admin, user_controller.fetch_class_student)

//this roues helps to fetch Student by a subject, Allowed by Teacher n=and Class Teacher
route.get("/subject/student", Authorization, teacher_admin, user_controller.fetch_subject_student)


//switch between diabling and enabling teachers
route.get("/toggle/:id", Authorization, Admin, user_controller.enable_teacher)


route.delete("/teacher/remove/:id", Authorization, teacher_admin, user_controller.delete_teacher)

//this route helps get all teachers for admin
route.get("/teachers/all", Authorization, teacher_admin, user_controller.fetch_all_teachers)


//this route helps get a single teacher for the admin
route.get("/teachers/:id", Authorization, Admin, user_controller.fetch_teacher),

    //this route helps with resetting teachers password by admin only
    route.post("/teacher/reset/:id", [
        check("password").notEmpty().withMessage("All fields are required")
            .isStrongPassword().withMessage("Password must contain a special character, a number and Mixed Character")
    ], Authorization, Admin, user_controller.teacher_reset_password)
// theis route help search for admin account with email 
route.get("/admin/:id", [
    check("email").notEmpty().withMessage("All fields are required")
        .isEmail().withMessage("Email must be a valid Email Address")
], user_controller.find_admin_with_email)


// theis route help admin set security question for resetting password
route.post("/admin/:id", [
    check("question").notEmpty().withMessage("Please fill out all fields"),
    check("answer").notEmpty().withMessage("Please fill out all fields"),
], Authorization, Admin, user_controller.add_forgotten_password_question)

//this helps check if the answer is correct with the one stored in database
route.post("/admin/:id", [
    check("answer").notEmpty().withMessage("All fields are required")
], user_controller.find_admin_with_email)

//this helps reset the password finally
route.post("/admin/reset", [
    check("password").notEmpty().withMessage("All fields are required")
        .isStrongPassword().withMessage("Password must contain a special character, a number and Mixed Character")
], user_controller.admin_reset_password)


//this route should help to delete a student record
route.delete("/std/delete/:id", Authorization, Admin, user_controller.delete_student)

//this route should help search for Student and filter them


module.exports = route