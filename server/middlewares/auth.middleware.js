import AppError from "../utils/error.util.js";
import jwt from 'jsonwebtoken'
const isLoggedIn = async function(req, res, next){
    const {user_info} = req.cookies;
    if(!user_info){
        return next(new AppError("unAuthenticated User, Please Login Again", 401));
    }

    const userDetails = await jwt.verify(user_info, process.env.JWT_SECRET);

    req.user = userDetails;
    next();

}

export {
    isLoggedIn
}