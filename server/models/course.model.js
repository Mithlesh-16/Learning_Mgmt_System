import {model, Schema} from "mongoose";

const courseSchema = new Schema({
    title:{
        type: String,
        trim: true,
        required: [true, "Title is Required"],
        minLength: [8, "Title must be atleast 8 chars"],
        maxLength: [60, "Title should be of atmost 60 chars"]
    },
    description: {
        type: String,
        required: [true, "Description is Required"],
        minLength: [8, "Description must be atleast 8 characters"],
        maxLength: [200, "Description should be less than 200 chars"]

    },
    category:{
        type:String,
        required: [true, 'category is required']
    },
    thumbnail:{
        public_id: {
            type:String,
            required: true,

        },
        secure_url: {
            type: String,
            required: true,
        }
    },
    lectures: [
        {
            title: String,
            description: String,
            lecture:{
                public_id: {
                    type:String,
                    required: true,
                },
                secure_url: {
                    type: String,
                    required: true,

                }
            }
        }
    ],
    numberOfLectures:{
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        required: true,
        Default : "Admin"
    },
},{
    timestamps: true,
});



const Course = model('course', courseSchema);
export default Course;