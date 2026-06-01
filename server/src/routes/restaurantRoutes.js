import express from "express";
import {
    deleteLogo,
    getProfile,
    updateProfile,
    uploadLogo,
} from "../controller/RestaurantController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { uploadLogo as uploadLogoMiddleware } from "../middleware/uploadMiddleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

const handleLogoUpload = (req, res, next) => {
    uploadLogoMiddleware(req, res, (err) => {
        if (err) return next(err);
        next();
    });
};

router.get("/profile", authenticate, asyncHandler(getProfile));
router.put("/profile", authenticate, asyncHandler(updateProfile));
router.post("/profile/logo", authenticate, handleLogoUpload, asyncHandler(uploadLogo));
router.delete("/profile/logo", authenticate, asyncHandler(deleteLogo));

export default router;
