import {Router} from 'express';
const router = Router();

import{getAllCourses, getLecturesByCourseId, createCourse, updateCourse, removeCourse} from '../controller/course.controller.js'
import { isLoggedIn } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js'

// Define course-related routes here
router.route('/')
    .get(getAllCourses)
    .post(upload.single('thumbnail'), createCourse);
    

router.route("/:id")
    .get(isLoggedIn, getLecturesByCourseId)
    .put(updateCourse)
    .delete(removeCourse);
// router.post("", );


export default router;