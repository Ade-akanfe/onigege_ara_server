const mongoose=require("mongoose")
const Schema = mongoose.Schema

const question_schema=new Schema({
    exam:{
        type:Schema.Types.ObjectId,
        ref:"Exam",
        required:true
    },
    question:{
        type:String,
        required:true
    },
    image:{
        type:String
    },
    answers:[],
    correct_answer:{
        type:String,
        required:true
    }
},{
    timestamps:true
})
module.exports=question_schema