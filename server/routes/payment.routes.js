import {Router} from 'express';
import { allPayments, buySubscription, cancelSubscription, getRazorpayApiKey, verifySubscription } from '../controller/payment.controller.js';
import { authorizedRoles, isLoggedIn } from '../middlewares/auth.middleware.js';

const router = Router();

router
    .route('/razorpay-key')
    .get(
        isLoggedIn,
        getRazorpayApiKey
    );


router
    .route('/subscribe')
    .post(
        isLoggedIn,
        buySubscription
    );

router
    .route('/verify') 
    .post(
        isLoggedIn,
        verifySubscription
    )

router
    .route('/unsubscribe')
    .post(
        isLoggedIn,
        cancelSubscription
    )

router
    .route('/')
    .get(
        isLoggedIn,
        authorizedRoles('ADMIN'),
        allPayments
    );

export default router;

// {
//     "razorpay_payment_id": "pay_TQbdsj0E0WHqC4",
//     "razorpay_subscription_id": "sub_TQbaw7SDWtPZ5s",
//     "razorpay_signature": "65ffbc7e878959c3a6658d8442d54071d87282e9a77a37deb16a42de7d3c8871"
// }

// {
//     "email":"mithlesh.kr.cs@gmail.com",
//     "password":"Mith@1668"
// }