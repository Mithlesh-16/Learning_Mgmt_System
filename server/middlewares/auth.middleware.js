import AppError from "../utils/error.util.js";
import jwt from 'jsonwebtoken'
const isLoggedIn = async function(req, res, next){
    const {user_info} = req.cookies;
    if(!user_info){
        return next(new AppError("unAuthenticated User, Please Login Again", 401));
    }

    const userDetails = jwt.verify(user_info, process.env.JWT_SECRET);

    req.user = userDetails;
    next();

}

const authorizedRoles = (...roles) => async(req, res, next) =>{
    const currentUserRoles = req.user.role;

    if(!roles.includes(currentUserRoles)){
        return next(new AppError("you don't have permission to access this Route !!", 400));
    }

    next();
}

const authorizedSubscriber = async(req, res, next) => {
    const currentUserRoles = req.user.role;
    const subscription = req.user.subscription;

    if(currentUserRoles != "ADMIN" && subscription.status != "active"){
        return next(
            new AppError("Please Subscribe to access this course !!", 400)
        )
    }
    next();
}

export {
    isLoggedIn,
    authorizedRoles,
    authorizedSubscriber
}