import mongoose from 'mongoose';
mongoose.strictQuery = false;

const mongoURL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/learning_mgmt_system";

const connectToDB = async()=> {
    try{
        const connection = await mongoose.connect(mongoURL);
        if(connection){
            console.log('Connection to DB Successful !!');
        }
    }
    catch(err){
        console.log('error connecting to DB', err);
        process.exit(1);
    }
}

export default connectToDB;