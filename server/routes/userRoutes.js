import router from 'express';
const userRouter = router();
import { registerUser, loginUser, getUserProfile, logoutUser, forgotPassword, resetPassword, changePassword, updateProfile } from '../controller/user.controller.js';
import {isLoggedIn} from '../middlewares/auth.middleware.js'
import upload from '../middlewares/multer.middleware.js';

// Define user-related routes here
userRouter.post('/register', upload.single('avatar'), registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/profile', isLoggedIn, getUserProfile);
userRouter.get('/logout', logoutUser);
userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/reset-password/:token', resetPassword);
userRouter.post('/change-password', isLoggedIn, changePassword);
userRouter.put('/profile-update/', isLoggedIn, upload.single('avatar'),updateProfile);

export default userRouter;