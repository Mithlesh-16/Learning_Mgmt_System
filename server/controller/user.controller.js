import AppError from '../utils/error.util.js'
import user from '../models/user.model.js';
import cloudinary from 'cloudinary';
import fs from 'fs';
import { getSystemErrorMessage } from 'util';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

const cookieOptions = {
    maxAge: 7*24*60*60*1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'? true: false,
}

const registerUser = async (req, res, next) => {
    const {fullName, email, password, role} = req.body;
    
    if(!fullName || !email || !password){
        return next(new AppError('All Fields are Required', 400));
    }

    const userExists = await user.findOne({email});    

    if(userExists){
        return next(new AppError('User Already Exists !!', 400));
    }

    const User = await user.create({
        fullName,
        email, 
        password,
        avatar:{
            public_id: "email",
            secure_url: "https://res.cloudinary.com/dqb2i2ca9/image/upload/v1679957893/lms/default_avatar_oqs6u3.png"
        },
        role
    });

    if(!User){
        return next(new AppError('User Registration Failed, please try Again!! ', 404));
    }

    //ToDo: file upload for avatar
    if(req.file){
        console.log("File Details",req.file);
        try{
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: "lms",
                width: 250,
                height: 250,
                gravity: "faces",
                crop: "fill"
            })

            if(result){
                User.avatar = {
                    public_id: result.public_id,
                    secure_url: result.secure_url
                }

                //remove file from server after uploading to cloudinary
                fs.rm(`../uploads/${req.file.filename}`, (err) => {
                    if (err) {
                        console.error("Failed to remove file:", err);
                    }
                });
            }

        }
        catch(err){
            return next(new AppError("Avatar Upload Failed, Please try Again", 500));
        }
    }

    await User.save();

    const token = await User.generateToken();
    if(!token){
        return next (new AppError("Token Generation Failed, Please try Again", 500));
    }
    res.cookie('user_info', token, cookieOptions);

    User.password = undefined;
    res.status(201).json({
        success: true,
        message: "User Registered Successfully",
        User
    })

}

const loginUser = async (req, res, next) => {
    const {email, password} = req.body;
    
    if(!email || !password){
        return next(new AppError("All Fields are required", 400));
    }

    const userExists = await user.findOne({email}).select('+password');
    
    if(!userExists || !(await userExists.comparePassword(password))){
        return next(new AppError("Email or Password does not Match", 400));
    }

    const token = await userExists.generateToken();
    if(!token){
        return next (new AppError("Token Generation Failed, Please try Again", 500));
    }
    userExists.password = undefined;
    res.cookie('user_info', token, cookieOptions);
    console.log(res.cookie.user_info);
    res.status(200).json({
        success: true,
        message: "User Logged in Successfully",
        userExists
    })
}

const getUserProfile = async (req, res, next) => {
    try{
        const userId = req.user.id;
        console.log(userId);
        const users = await user.findById(userId);

        res.status(200).json({
            success:true,
            message: "user Details",
            users
        })

    }catch(error){
        return next(new AppError("Failed to fetch user Details", 500))
    }

}

function logoutUser(req, res) {
    res.cookie('user_info', null, {
        secure: true,
        maxAge: 0,
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: "User Logged Out Successfully"
    });
} 

const forgotPassword = async(req, res, next) => {
    const {email} = req.body;

    const User = await user.findOne({email});

    if(!email || !User){
        return next(new AppError("Email is Required", 400));
    }
    const resetToken = await User.generateForgotPasswordToken();

    await User.save();

    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const subject = "Reset Your Password";
    const message = `you can reset your password by clicking on the following link: ${resetPasswordURL}`;
    console.log("Reset Password URL:", resetPasswordURL);

    try{
        await sendEmail(email, subject, message);

        res.status(200).json({
            success: true,
            message: `Email sent to ${email} Successfully to reset Password`
        })
    }
    catch(err){
        User.forgotPasswordExpiry = undefined;
        User.forgotPasswordToken = undefined;

        await User.save();

        return next(new AppError("Failed to Send Email, Please try Again", 500));
    }
}

const resetPassword = async(req, res, next) => {
    const {token} = req.params;
    const {newPassword} = req.body;

    if(!token || !newPassword){
        return next (new AppError("All Fields are Required", 400));
    } 

    const forgotPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

    const User = await user.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry:{$gt: Date.now()}
    });

    if(!User){
        return next(new AppError("Invalid or Expired Token", 400));
    }

    User.password = newPassword;
    User.forgotPasswordToken = undefined;
    User.forgotPasswordExpiry = undefined;
    console.log("Resetting Password to:", newPassword);
    await User.save();
    User.password = undefined;
    console.log("User after resetting password:", User);

    res.status(200).json({
        success: true,
        message: "Password Reset Successfully, You can Login with your new Credentials"
    })
}
const changePassword = async(req, res, next) => {
    try{
        const userId = req.user.id;
        const {oldPassword, newPassword} = req.body;

        if(!oldPassword || !newPassword){
            return next(new AppError("All Fields are Required !!", 400));
        }

        const User = await user.findById(userId).select('password');
        const valid = await User.comparePassword(oldPassword);
        if(!valid){
            return next(new AppError("Old Password isn't valid, please try Again", 400));
        }
        User.password = newPassword;
        await User.save();
        User.password = undefined;
        return res.status(200).json({
            success: true,
            message: "Password changed Successfully !!",
            User
        })
    }
    catch(err){
        return next(new AppError("Unable to Change Password, Please try again Later!!",400));
    }

}

const updateProfile = async(req, res, next) => {
    try{
        const userId = req.user.id;
        const {fullName} = req.body;

        const User = await user.findById(userId);
        if(!User) return next(new AppError("User does not Exist!!"));
        
        if(fullName) User.fullName = fullName;

        if(req.file && User.avatar){
            if(User.avatar && User.avatar.public_id)
                await cloudinary.v2.uploader.destroy(User.avatar.public_id);

            try{
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    width: 250,
                    height: 250,
                    folder: "lms",
                    crop: "fill",
                    gravity: "faces"
                })

                if(result){
                    User.avatar.public_id = result.public_id;
                    User.avatar.secure_url = result.secure_url;

                    //remove the file from server after uploading it to cloudinary
                    fs.rm(`../uploads/${req.file.filename}`)
                }

            }catch(err){
                return next(new AppError(err || "file not uploaded, please try again!!", 500));
            }
        }

        await User.save();
        res.status(200).json({
            success: true,
            message: "User Details updated Successfully!!"
        })

    }
    catch(err){
        return next(new AppError(err || "Profile Updation Failed, Please try again", 500));
    }
}

export {
    registerUser,
    loginUser, 
    getUserProfile,
    logoutUser,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile
}
