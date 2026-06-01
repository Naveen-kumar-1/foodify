import express from "express";
import {
    changePassword,
    forgotPassword,
    getOtpStatus,
    login,
    resendOtp,
    resendResetOtp,
    resetPassword,
    setPassword,
    signup,
    verifyEmail,
    verifyResetOtp,
    verifyResetToken,
} from "../controller/AuthController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.post("/signup", asyncHandler(signup));
router.post("/resend-otp", asyncHandler(resendOtp));
router.get("/otp-status", asyncHandler(getOtpStatus));
router.post("/verify-email", asyncHandler(verifyEmail));
router.post("/set-password", asyncHandler(setPassword));
router.post("/login", asyncHandler(login));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.get("/verify-reset-token", asyncHandler(verifyResetToken));
router.post("/resend-reset-otp", asyncHandler(resendResetOtp));
router.post("/verify-reset-otp", asyncHandler(verifyResetOtp));
router.post("/reset-password", asyncHandler(resetPassword));
router.post("/change-password", authenticate, asyncHandler(changePassword));

export default router;
