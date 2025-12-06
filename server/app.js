import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import userRoutes from './routes/user.routes.js';
import courseRoutes from './routes/course.routes.js';
import errorMiddleware from './middlewares/error.middleware.js';
const app = express();

app.use(express.json());
app.use(cors({
    origin: process.env.frontend_url,
    credentials : true
}));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.urlencoded({extended: true}));

//users 
app.use('/api/v1/users', userRoutes);

//courses
app.use('/api/v1/courses', courseRoutes);

// //routes of 3 modules
app.all('*', (req, res) => {
    res.status(404).send("404! Page not found.");
})

app.use(errorMiddleware);

export default app;