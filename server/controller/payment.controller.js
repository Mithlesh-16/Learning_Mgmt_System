import AppError from "../utils/error.util.js";
import {razorpay} from '../server.js'
import Payment from "../models/payment.model.js";
import crypto from 'crypto'
import User from "../models/user.model.js";

export const getRazorpayApiKey = async(req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Razorpay Api key ",
        key: process.env.RAZORPAY_KEY_ID
    })
}

export const buySubscription = async(req, res, next) => {
    try{
        const {id} = req.user;
        const user = await User.findById(id);

        if(!user){
            return next(
                new AppError('Unauthorised, please Login')
            )
        }

        if(user.role === 'ADMIN'){
            return next(
                new AppError(
                    'Admin cannot purchase a subscription', 400
                )
            )
        }

        // const subscription = await razorpay.subscriptions.create({
        //     plan_id: process.env.RAZORPAY_PLAN_ID,
        //     customer_notify: 1
        // });

        const subscription = await razorpay.subscriptions.create({
    plan_id: process.env.RAZORPAY_PLAN_ID,
    total_count: 12,
    quantity: 1,
    customer_notify: true
});

        user.subscription.id = subscription.id;
        user.subscription.status = subscription.status;

        await user.save();
        res.status(200).json({
            success: true,
            message: 'Subscribed Successfully',
            subscription_id: subscription.id
        })
    }
    catch(e){
        return next(
            new AppError(e.message, 400)
        )
    }
}

export const verifySubscription = async(req, res, next) => {
    try{
        const {id} = req.user;
        const {razorpay_payment_id, razorpay_signature, razorpay_subscription_id} = req.body;

        const user = await User.findById(id);
        if(!user){
            return next(
                new AppError('Unauthorized, please Login')
            )
        }

        const subscription = user.subscription.id;

        if(user.subscription.id != razorpay_subscription_id){
            return next(
                new AppError("Invalid subscription_id", 400)
            )
        }

        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(`${razorpay_payment_id}|${subscription}`)
            .digest('hex');

        if(generated_signature !== razorpay_signature){
            return next(
                new AppError("payment not verified, please try again", 500)
            )
        }

        await Payment.create({
            razorpay_payment_id,
            razorpay_signature,
            razorpay_subscription_id
        })
        
        user.subscription.status = 'active'; //active at user level
        await user.save();
        res.status(200).json({
            success: true,
            message: "payment verified successfully"
        })

    }
    catch(e){
        return next(
            new AppError("Error while verifying Subscription!!", 400)
        )
    }
}

export const cancelSubscription = async(req, res, next) => {
    try{
        const {id} = req.user;
        const user = await User.findById(id);

        if(!user){
            return next(
                new AppError('Unauthorised, please login')
            )
        }

        if(user.role === 'ADMIN'){
            return next(
                new AppError(
                    'Admin cannot cancel a subscription', 400
                )
            )
        }

        const subscriptionId = user.subscription.id;
        const subscription = await razorpay.subscriptions.cancel(
            subscriptionId
        )

        user.subscription.status = subscription.status;
        await user.save();

        res.status(200).json({
            success:true,
            message:"subscription Cancelled Successfully!!"
        })
 
    }
    catch(e){
        return next(
            new AppError('Error during Cancellation Occured!!', 400)
        )
    }

}

export const allPayments = async(req, res, next) => {
    try{
        const {count} = req.query;

        const subscriptions = await razorpay.subscriptions.all({
            count: count || 10,
        })


        res.status(200).json({
            success: true,
            message: 'All payments',
            subscriptions
        })
    }
    catch(e){

    }
    

    
}