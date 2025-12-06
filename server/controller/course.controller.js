import Course from '../models/course.model.js'
import AppError from '../middlewares/error.middleware.js'
const getAllCourses = async(req, res, next) => {
    try{
        const courses = await Course.find({}).select('-lectures');

        res.status(200).json({
            success: true,
            message: "all courses that you have",
            lectures: courses.lectures
        }) 
    }
    catch(err){
        return next(new AppError(err.message, 500))
    }
    

}

const getLecturesByCourseId = async(req, res, next) => {
    try{
        const {id} = req.params;
        const lectures = await Course.findById({id});
        res.status(200).json({
            success: true,
            message: "Course lectures fetched Successfully",
        })

    }catch(e){
        return next(new AppError(e.message, 500));
    }

}

export {
    getAllCourses,
    getLecturesByCourseId
}