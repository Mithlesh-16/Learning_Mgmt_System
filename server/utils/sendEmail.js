// this file is used to send email using nodemailer 
// it will be used in forgot password functionality
// this code is basically provided by the nodemailer package 
import nodemailer from "nodemailer";

const sendEmail = async(email, subject, message) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,    //SMTP_HOST is Host of the email service provider e.g. smtp.gmail.com
        port: process.env.SMTP_PORT,    //SMTP_PORT is Port of the email service provider e.g. 465 for gmail
        secure: true,  //true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USERNAME,    //SMTP_USERNAME is the username of the email service provider e.g. your email id
            pass: process.env.SMTP_PASSWORD,    //SMTP_PASSWORD is the password of the email service provider e.g. app password

        },
    });

    //send mail with defined transport object
    await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL,  //sender address
        to: email,  //user email address
        subject: subject, //Subject line
        html: message,  //html body
    });
};

export default sendEmail;