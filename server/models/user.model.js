import {Schema, model} from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto'

const userSchema = new Schema({
    fullName: {
        type: String,
        required: [true, "Name is Required"],
        minLength: [5, "Name must be at least 5 characters"],
        maxLength: [50, "Name must be less than 50 Characters"],
        lowercase: true,
        trim: true
    }, 
    email:{
        type: String,
        required: [true, "Email is Required"],
        lowercase: true,
        unique: true,
        trim: true,
        match:[/^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    "Please provide a valid email"]
    },
    password:{
        type: String,
        required: [true, "Password is Required"],
        minLength: [8, 'password must be at least 8 characters'],
        select: false
    },
    avatar: {
        public_id: {
            type: String
        },
        secure_url:{
            type: String
        }
    },
    role:{
        type: String,
        enum: ['USER', 'ADMIN'],
        default : 'USER',
        uppercase: true
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    subscription:{
        id: String,
        status: String
    }
},
{
    timestamps: true
});

userSchema.methods.generateToken = function(){
    // jwt.sign(payload, secret, options); 
    return jwt.sign({
        id: this._id,
        fullName: this.fullName,
        email: this.email,
        role: this.role,
        subscription: this.subscription
    },
    process.env.JWT_SECRET,
    {
        expiresIn: process.env.JWT_EXPIRY
    })
}

userSchema.methods.generateForgotPasswordToken = async function(){
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.forgotPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

    this.forgotPasswordExpiry = Date.now() + 15*60*1000; //15min from now

    return resetToken;
    

}

userSchema.methods.comparePassword = async function(given_password){
    return await bcrypt.compare(given_password, this.password);
}

userSchema.pre('save', async function(){
    if(!this.isModified('password')) return ;
    this.password = await bcrypt.hash(this.password, 10);
})

const user = model('user', userSchema);
export default user;