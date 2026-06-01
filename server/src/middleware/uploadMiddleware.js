import multer from "multer";
import { AppError } from "./errorHandler.js";

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError("Only JPG, PNG, and WEBP images are allowed", 400), false);
    }
};

export const uploadLogo = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
}).single("logo");
