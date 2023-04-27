const { validationResult } = require("express-validator")
const user_model = require("../models/user_model")
const admin_model = require("../models/admin-model")
const teacher_model = require("../models/teacher-model")
const class_model = require("../models/class_model")
const token_model = require("../models/token-model")
const subject_model = require("../models/subject-model")

const jwt = require("jsonwebtoken")
const { generate_token, generate_refresh_token, encrypt_password } = require("../utils/helper")


const controller = {
    student_signup: async (req, res, next) => {
        try {
            const { regNo, firstname, lastname, middlename, class: student_class, gender } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            const class_doc = await class_model.findOne({ _id: student_class })
            if (!class_doc) {
                let error = new Error("Please pick a class and try again");
                return next({ message: error, status: 400 });
            }
            const new_student = new user_model({
                regNo,
                firstname,
                lastname,
                middlename: middlename ? middlename : "",
                class: class_doc._id,
                gender
            })

            const token = generate_token({ _id: new_student._id, class: new_student.class, regNo: new_student.regNo, type: "Student" })
            const refresh_token = generate_refresh_token()
            const token_data = new token_model({
                owner: new_student._id,
                token: [{
                    token,
                    expiresIn: new Date(Date.now()).getHours() + 2
                }],
                type: "Student",
                refresh_token
            })
            new_student.token = token_data._id
            // const teacher = await teacher_model.findOne({ class: student_class, roles:{ $in: { roles: "CLASS TEACHER" } }})
            await class_model.updateOne({ _id: class_doc._id }, { $push: { students: new_student._id } })
            await token_data.save()
            await new_student.save()
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    student_signin: async (req, res, next) => {
        try {
            const { regNo } = req.body
            const user = await user_model.findOne({ regNo })
            if (!user) {
                return next({ message: "User with Registration Number can't be found", status: 400 })
            }
            const token = generate_token({ _id: user._id, class: user.class, regNo: user.regNo, type: "Student" })
            const token_data = await token_model.findOne({ owner: user._id, _id: user.token })
            token_data.token = [...token_data.token, {
                token,
                expiresIn: new Date(Date.now()).getHours() + 2
            }]
            res.status(200).json({ token: token, refresh_token: token_data.refresh_token, id: user._id })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    teacher_signup: async (req, res, next) => {
        try {
            const { email, password, firstname, lastname, gender } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            const passwordHashed = await encrypt_password(password)
            const teacher = new teacher_model({
                email,
                password: passwordHashed,
                firstname,
                lastname,
                gender,
            })
            const token = generate_token({ type: "Teacher", _id: teacher._id })
            const refresh_token = generate_refresh_token()
            const token_data = new token_model({
                owner: teacher._id,
                refresh_token,
                type: "Teacher",
                token: [
                    {
                        token,
                        expiresIn: new Date(Date.now()).getHours() + 2
                    }
                ]
            })
            teacher.token = token_data._id
            await token_data.save()
            await teacher.save()
            res.status(200).json({ id: teacher._id, refresh_token, token: token, message: "Please wait till you're verified" })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    teacher_login: async (req, res, next) => {
        try {
            const { email, password } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            const teacher = await teacher_model.findOne({ email: email })
            const token = generate_token({ type: "Teacher", _id: teacher._id })
            await token_model.updateOne({
                owner: teacher._id,
                _id: teacher.token,
            }, { $push: { token: { token, expiresIn: new Date(Date.now()).getHours() + 2 } } })
            const token_data = await token_model.findOne({ owner: teacher._id, _id: teacher.token })
            await teacher.save()
            res.status(200).json({ token, refresh_token: token_data.refresh_token, id: teacher._id, verified: teacher.verified })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    admin_signup: async (req, res, next) => {
        try {
            const { email, password } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            const passwordHashed = await encrypt_password(password)
            const admin = new admin_model({
                email,
                password: passwordHashed
            })
            const token = generate_token({ type: "Admin", _id: admin._id })
            const refresh_token = generate_refresh_token()

            const token_data = new token_model({
                owner: admin._id,
                refresh_token,
                type: "Admin",
                token: [
                    {
                        token,
                        expiresIn: new Date(Date.now()).getHours() + 2
                    }
                ]
            })
            admin.token = token_data._id
            await token_data.save()
            await admin.save()
            res.status(200).json({ refresh_token, accessToken: token, id: admin._id })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    admin_signin: async (req, res, next) => {
        try {
            const { email, password } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            const Admin = await admin_model.findOne({ email: email })
            const token = generate_token({ type: "Admin", _id: Admin._id })
            await token_model.updateOne({
                owner: Admin._id,
                _id: Admin.token,
            }, { $push: { token: { token, expiresIn: new Date(Date.now()).getHours() + 2 } } })
            const token_data = await token_model.findOne({ owner: Admin._id, _id: Admin.token })
            await Admin.save()
            res.status(200).json({ token, refresh_token: token_data.refresh_token, id: Admin._id })
        } catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    update_student: async (req, res, next) => {
        try {
            const { id } = req.params
            const { firstname, lastname, middlename, regNo, class: stdClass, gender } = req.body
            let user = await user_model.findByIdAndUpdate({ _id: id }, { firstname, lastname, middlename, regNo, class: stdClass, gender })
            await user.save()
            res.status(200).json({ id, token: req.token, refresh_token: req.refresh_token })
        } catch (error) {
            if (!error.status) {
                error.status = 500;
            }
            res.status(error.status).json({ message: error.message });

        }
    },
    fetch_student: async (req, res, next) => {
        try {
            const { id } = req.params
            const user = await user_model.findOne({ _id: id }).select("-password").select("-token").populate("class")
            if (!user) {
                return next({ message: "User not found", status: 500 })
            }
            res.status(200).json({ user, token: req.token, refresh_token: req.refresh_token })
        } catch (error) {
            if (!error.status) {
                error.status = 500;
            }
            res.status(error.status).json({ message: error.message });

        }
    },
    fetch_teacher: async (req, res, next) => {
        try {
            const { id } = req.params
            if (!id) {
                return next({ message: 'Please try again', status: 500 })
            }
            const teacher = await teacher_model.findOne({ _id: id }).select("firstname").select("lastname").select("Gender").select("email")
            if (!teacher) {
                return next({ message: 'Please try again', status: 500 })
            }

            res.status(200).json({ token: req.token, refresh_token: req.refresh_token, teacher })

        }
        catch (error) { }
    },
    //this route helps teacher to fetch their subjects
    fetch_teacher_subject: async (req, res, next) => {
        try {
            const teacher = await teacher_model.findOne({ _id: req.user._id })

            if (!teacher) {
                return next({ message: "Please try again", status: 400 })
            }
            const teacherSubjects = teacher.subjects
            const teacher_subject_updated = teacherSubjects.map(async (el) => {
                const sub = await subject_model.findOne({ _id: el.subject }).select("name")
                const classval = await class_model.findOne({ _id: el.class }).select("name")
                return {
                    subject: sub,
                    class: classval
                }
            })
            const final_result = await Promise.all(teacher_subject_updated)
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token, result: final_result })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    //this route should help to update teacher and set the subject for which class
    //this route will ask for a subject thena ask for class for student, you can pick more than one 
    // the class will be an array
    update_teacher: async (req, res, next) => {
        try {
            let user;
            const { id } = req.params
            if (req.type === "Admin") {
                user = await teacher_model.findOne({ _id: id })
            } else if (req.type === "Teacher") {
                user = await teacher_model.findOne({ _id: req.user._id })
            }

            const { subject, class: stdClassVal } = req.body;
            const stdClass = stdClassVal.split(",")
            const subject_val = await subject_model.findOne({ _id: subject }).select("name")
            if (!subject_val) {
                return next({ message: "Please try again" })
            }
            const newClass = stdClass.map(async (el) => {
                const class_details = await class_model.findOne({ _id: el }).select("name")
                return class_details
            })
            const classAll = await Promise.all(newClass)
            classAll.forEach(async (element) => {
                await teacher_model.updateOne({ _id: id }, {
                    $push: { subjects: { class: element._id, subject: subject_val._id } }
                })
            })
            // newVal.forEach(async (element) => {
            //     await subject_model.updateOne({ _id: element.subject }, { $push: { teachers: { teacher: user._id, class: element.class } } })
            //     await teacher_model.updateOne({ _id: user._id }, { $push: { subjects: { class: element.class, subject: subject_val._id } } })
            // })

            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    // this route helps teacher update self
    updateSelf: async (req, res, next) => {
        try {
            const { firstname, lastname, email, gender } = req.body

            if (!firstname || !lastname || !email || !gender) {
                return next({ message: "All fields are required", status: 500 })
            }
            await teacher_model.updateOne({ _id: req.user._id }, { firstname, lastname, email, gender })
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token, firstname, lastname, email, gender })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    teacher_reset_password: async (req, res, next) => {
        try {
            const { id } = req.params
            const { password } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            const teacher = await teacher_model.findOne({ _id: id })
            if (!teacher) {
                return next({ message: "please try again" })
            }
            const encrypted_password = await encrypt_password(password)
            await teacher_model.updateOne({ _id: teacher._id }, { password: encrypted_password })
            res.status(200).json({ message: "Password updated", token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    // help admin add forgoteen password helper question
    add_forgotten_password_question: async (req, res, next) => {
        try {
            const { question, answer } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            await admin_model.updateOne({ _id: req.user._id }, { question, answer })
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    //check if admin exist in a document
    find_admin_with_email: async (req, res, next) => {
        try {
            const { email } = req.body
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            const admin = await admin_model.findOne({ email })
            if (!admin) {
                return next({ message: "please try again, account not found" })
            }
            res.status(200).json({ message: "Account exist" })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    //verify if the question are correct with the admin account
    verify_admin_password: async (req, res, next) => {
        try {
            const { question, answer, email } = req.body
            const admin = await admin_model.findOne({ email })
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                let error = errors.errors[0].msg;
                return next({ message: error, status: 400 });
            }
            if (admin.answer !== answer.toUpperCase()) {
                return next({ message: "Not correct, please try something else" })
            }
            res.status(200).json({ message: "Please set a new Password" })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    //reset admin password successfully
    admin_reset_password: async (req, res, next) => {
        try {
            const { password, email } = req.body
            const admin = await admin_model.findOne({ email })
            const password_encrypted = await encrypt_password(password)
            await admin_model.updateOne({ _id: admin._id }, { password: password_encrypted })
            res.status(200).json({ message: "password updated" })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    // this routes should help assign role to teacher like class teacher, HOD
    assign_roles: async (req, res, next) => {
        try {
            const { id } = req.params
            const { roles: val, class: classval } = req.body
            const roles = val.split(",")
            const classes = classval.split(",")

            const teacher = await teacher_model.findOne({ _id: id })
            if (!teacher) {
                return next({ message: "Please try again later. Thanks" })
            }
            if (!roles) {
                return next("Please assign role to teacher")
            }
            if (teacher.roles.length > 0) {
                if (roles.includes("CLASS TEACHER")) {
                    await teacher_model.updateOne({ _id: id }, { $set: { roles } })
                    await class_model.updateMany({ _id: { $in: classes } }, { $unset: { class_teacher: "" } })
                }
            } else {
                await teacher_model.updateOne({ _id: id }, { $set: { roles } })
                await class_model.updateMany({ _id: { $in: classes } }, { class_teacher: teacher._id })
            }

            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    remove_role: async (req, res, next) => {
        try {
            const { id } = req.params
            const { role } = req.body

            const teacher = await teacher_model.findOne({ _id: id })
            if (!teacher) {
                return next({ message: "Please try again later. Thanks" })
            }
            if (!role) {
                return next({ message: "Please assign role to teacher" })
            }
            await teacher_model.updateOne({ _id: id }, { $pull: { roles: role.toUpperCase() } })
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },

    //assign class to teachers
    assign_class: async (req, res, next) => {
        try {
            const { class: stdClass } = req.body
            const { id } = req.params
            const teacher = await teacher_model.findOne({ _id: id })
            if (!teacher) {
                return next({ message: "please try again" })
            }
            const stclass = await class_model.findOne({ _id: stdClass })
            if (!stclass) {
                return next({ message: "please try again" })
            }
            const istrue = teacher.roles.find(el => el === "CLASS TEACHER")
            if (!istrue) {
                await teacher_model.updateOne({ _id: teacher._id }, { $set: { class: stdClass }, $push: { roles: "CLASS TEACHER" } })
            }
            if (teacher.class) {
                const tchclass = await class_model.findOne({ _id: teacher.class })
                const secondtch = await class_model.findOne({ _id: stdClass })
                if (secondtch) {
                    await class_model.updateOne({ _id: secondtch._id }, { $unset: { class_teacher: "" } })
                    await user_model.updateMany({ class: secondtch._id }, { $unset: { class_teacher: "" } })
                    await teacher_model.updateOne({ _id: secondtch.class_teacher }, { $unset: { class: "", students: [] } })
                }
                await class_model.updateOne({ _id: tchclass._id }, { $unset: { class_teacher: "" } })
                await user_model.updateMany({ class: tchclass._id }, { $unset: { class_teacher: "" } })
                await teacher_model.updateOne({ _id: teacher.class_teacher }, { $unset: { class: "", students: [] } })
            }
            const students = await user_model.find({ class: stclass._id }).select("_id")
            await teacher_model.updateOne({ _id: teacher._id }, { $set: { class: stdClass, students: students } })
            await class_model.updateOne({ _id: stclass._id }, { $set: { students, class_teacher: teacher._id } })
            await user_model.updateMany({ class: stclass._id }, { $set: { class_teacher: teacher._id } })

            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 200
            }
            res.status(error.status).json({ message: error.message })
        }
    },

    //this role help check is teacher is a class teacher or HOD to access a class student
    fetch_class_student: async (req, res, next) => {
        try {
            let user;
            user = await teacher_model.findOne({ _id: req.user._id })
            if (req.type === "Teacher") {
                isthere = user.roles.includes("CLASS TEACHER")
                if (!isthere) {
                    return res.status(250).json({ token: req.token, refresh_token: req.refresh_token, message: "You're not allowed to preform this action" })
                }
            }
            const { id } = req.params
            let teacher_class;
            let teacher_student;
            if (req.type === "Teacher") {
                teacher_class = await class_model.find({ class_teacher: user._id })
                teacher_student = await user_model.find({ class_teacher: user._id })
            } else if (req.type === "Admin") {
                teacher_class = await class_model.find({ _id: id })
                if (!teacher_class) {
                    return next({ message: "please try again" })
                }
                const val = teacher_class.map(el => el._id)
                teacher_student = await user_model.find({ class: { $in: val } }).select("-password")
                if (!teacher_class) {
                    return next({ message: "please try again" })
                }
            }
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token, teacher_class, teacher_student })

        }
        catch (error) {
            if (!error.status) {
                error.status = 200
            }
            res.status(error.status).json({ message: error.message })
        }
    },

    //this route help a teacher fetch subject results exam
    fetch_subject_student: async (req, res, next) => {
        try {

        }
        catch (error) { }
    },
    // this role helps Admin to verifiy and enable  a teacher
    enable_teacher: async (req, res, next) => {
        try {
            const { id } = req.params
            const teacher = await teacher_model.findOne({ _id: id })
            if (!teacher) {
                return next({ message: "please try again" })
            }
            if (teacher.verified) {
                await teacher_model.updateOne({ _id: teacher._id }, { $set: { verified: false } })
            } else {
                await teacher_model.updateOne({ _id: teacher._id }, { $set: { verified: true } })
            }
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },

    // this route helps to delete a teacher
    delete_teacher: async (req, res, next) => {
        try {
            const { id } = req.params
            const teacher = await teacher_model.findOne({ _id: id })
            if (!teacher) {
                return next({ message: "try again" })
            }
            await user_model.updateMany({ class_teacher: teacher._id }, { $unset: { class_teacher: "" } })
            await token_model.deleteOne({ owner: teacher._id })
            await teacher_model.deleteOne({ _id: teacher._id })
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(err0r.status).json({ message: error.message })
        }
    },

    //this route help admin fetch all teachers in the School
    fetch_all_teachers: async (req, res, next) => {
        try {
            let { subject, class: queryVal } = req.query
            if (subject) {
                subject = subject.toUpperCase().replace("_", " ")
            }
            let teachers;
            if (req.type === "Teacher") {
                teachers = teacher_model.findOne({ _id: req.user._id }).select("firstname").select("lastname").select("-password").select("-token")
            } else {
                if (req.query.not_verified) {
                    teachers = await teacher_model.find({
                        verified: false
                    }).select("firstname").select("lastname").select("-password").select("-token")
                } else {
                    teachers = await teacher_model.find().select("-password").select("-token")
                }
            }
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token, teachers })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    time_left_student: async (req, res, next) => {
        try {
            const user = await user_model.findOne({ _id: req.user._id })
            if (!user) {
                return next("Please try again")
            }
            res.status(200).json({ time: user.time, token: req.token, refresh_token: req.refresh_token })
        }
        catch (error) {
            if (!error.status) {
                error.status = 500
            }
            res.status(error.status).json({ message: error.message })
        }
    },
    delete_student: async (req, res, next) => {
        try {
            const { id } = req.params
            const student = await user_model.findOne({ _id: id })
            if (!student) {
                return next({ message: " Student record not found", status: 400 })
            }
            await user_model.deleteOne({ _id: id })
            res.status(200).json({ token: req.token, refresh_token: req.refresh_token })
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