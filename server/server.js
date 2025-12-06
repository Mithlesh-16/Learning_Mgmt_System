import {config} from 'dotenv';
config();
import app from './app.js'
import connectionToDB from './config/dbConnection.js';
import cloudinary from 'cloudinary'; 

//cloudinary Configuration 
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
 
const port = process.env.PORT || 3500;

app.listen(port, async () => {
    await connectionToDB();
    console.log(`server is running on port ${port}`);
})
