import path from 'path';
import multer from 'multer';

const upload = multer({
    dest: "../uploads/",
    limits: {
        fileSize: 50*1024*1024 //50MB limit
    },
    storage: multer.diskStorage({
        destination: "../uploads/", 
        filename: (_req, file, cb) => {
            cb(null, file.originalname);
        },
    }),
    fileFilter: (_req, file, cb) => {
        let ext = path.extname(file.originalname);

        if(
            ext !== ".png" && 
            ext !== ".jpg" && 
            ext !== ".jpeg" &&
            ext !== ".webp" &&
            ext !== ".mp4"
        )
        {
            return cb(new Error("File type is not supported"), false);
        }
        cb(null, true);
    }
});
export default upload;