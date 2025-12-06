import {Router} from 'express';
const router = Router();

import{getAllCourses, getLecturesByCourseId} from '../controller/course.controller.js'
import { isLoggedIn } from '../middlewares/auth.middleware.js';

// Define course-related routes here
router.get('/', getAllCourses);
router.get("/:id", isLoggedIn, getLecturesByCourseId);
// router.post("", );


export default router;