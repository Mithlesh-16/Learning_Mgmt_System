import Course from '../models/course.model.js'
import AppError from '../utils/error.util.js'
import fs from 'fs'
import cloudinary from 'cloudinary'

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

const createCourse = async(req, res, next) => {
    try{
        const {title, description, category, createdBy} = req.body;
        
        if(!title || !description || !category || !createdBy){
            return next(new AppError("All Fields are required", 400));
        }

        const course = await Course.create({
            title,
            description,
            category,
            createdBy,
            thumbnail: {
                public_id: "dummy",
                secure_url: "dummy"
            }
        });

        if(!course){
            return next(new AppError("Course could not be created !!", 500));
        }
        console.log("upto course Creation");
        try{
            console.log("inside try Block of file uploading");

                if(req.file){
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms',
                    height: 400,
                    width: 400,
                    crop: "fill",
                    gravity: "faces"
                })


                if(result){
                    course.thumbnail.public_id = result.public_id;
                    course.thumbnail.secure_url = result.secure_url;
                    console.log(result, "inside the result block");
                    //remove file from server
                    fs.rm(`../uploads/${req.file.path}`, (err) => {
                        console.log("Removed the files successfully");
                    });
                }

                await course.save();

                res.status(200).json({
                    success: true,
                    message: "Course created successfully!!",
                    course
                })

            }

        }catch(e){
            return next(new AppError(e.message, 500))

        }
    }
    catch(e){
        return next(new AppError(e.message, 500));
        
    }
}

const updateCourse = async(req, res, next) => {
    try{

        const {id} = req.params;
        const course = await Course.findByIdAndUpdate(
            id,
            {
                $set: req.body
            },
            {
                runValidators: true
            }
        );

        await course.save();

        if(!course){
            return next(new AppError('Course with given id does not Exist', 500));
        }

        res.status(200).json({
            success: true,
            message: 'Course Updated Successfully !!',
            course
        })

    }catch(e){
        return next(new AppError(e.message, 500));
    }

}   

const removeCourse = async(req, res, next) => {
    try{
        const {id} = req.params;
        const course = await Course.findById(id);

        if(!course){
            return next(new AppError("Course with given id does not exists ", 500));
        }

        await Course.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "Course deleted Successfully"
        })

    }catch(e){
        return next(new AppError(e.message, 500));
    }
}

const addLecturesToCourseById = async(req, res, next) => {
    try{
        const {title, description} = req.body;
    const {id} = req.params;

    if(!title || !description){
        return next(new AppError("All Fields are required", 400));
    }
    const course = await Course.findById(id);
    if(!course){
        return next(new AppError("Course with given id doesn't Exist in database", 500));
    }
    
    const lectureData = {
        title, 
        description,
        lecture: {}
    };

    try{
            console.log("inside try Block of file uploading");

                if(req.file){
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms',
                    height: 400,
                    width: 400,
                    crop: "fill",
                    gravity: "faces"
                })


                if(result){
                    lectureData.lecture.public_id = result.public_id;
                    lectureData.lecture.secure_url = result.secure_url;
                    console.log(result, "inside the result block");
                    //remove file from server
                    fs.rm(`../uploads/${req.file.path}`, (err) => {
                        console.log("Removed the files successfully");
                    });
                }


                res.status(200).json({
                    success: true,
                    message: "Course created successfully!!",
                    course
                })

            }

        }catch(e){
            return next(new AppError(e.message, 500))

        }

        course.lectures.push(lectureData);
        course.numberOfLectures = course.lectures.length;
        await course.save();

        res.status(200).json({
            success: true,
            message: "Lectures added to the course Successfully !!",
            course
        })
    }
    catch(e){
        return next(new AppError(e.message, 400));
    }

}

export {
    getAllCourses,
    getLecturesByCourseId,
    createCourse,
    updateCourse,
    removeCourse,
    addLecturesToCourseById
}