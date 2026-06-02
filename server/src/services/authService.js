import bcrypt from "bcryptjs";
import Restaurant from "../model/Restaurant.js";
import PasswordResetToken from "../model/PasswordResetToken.js";
import { AppError } from "../middleware/errorHandler.js";
import { formatRestaurantProfile, generateAuthTokens, generateVerificationToken } from "../helpers/auth.js";
import { isEmailValid, isPasswordValid, PASSWORD_VALIDATION_MESSAGE } from "../helpers/common.js";
import { sendPasswordResetLinkEmail, sendPasswordResetOTPEmail } from "./emailService.js";
import { getAppBaseUrl } from "../config/appUrl.js";
import { createPasswordResetToken, validatePasswordResetToken, consumePasswordResetToken } from "./passwordResetService.js";
import {
    OTP_TTL,
    RESEND_COOLDOWN_SECONDS,
    checkResendCooldown,
    deleteResetOTP,
    deleteResetToken,
    generateOTP,
    getResetOTP,
    getResetOtpRemainingSeconds,
    getResetTokenData,
    setResendCooldown,
    storeResetOTP,
    storeResetToken,
} from "./redisService.js";

export const forgotPassword = async (email) => {
    if (!email) {
        throw new AppError("Email is required", 400);
    }

    if (!isEmailValid(email)) {
        throw new AppError("Invalid email", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const restaurant = await Restaurant.findOne({ email: normalizedEmail });

    if (!restaurant) {
        throw new AppError("No account found with this email address.", 404);
    }

    if (!restaurant.isActive) {
        throw new AppError("This account is inactive. Please contact support.", 403);
    }

    const clientUrl = getAppBaseUrl();
    const { token } = await createPasswordResetToken({
        restaurantId: restaurant.restaurantId,
        email: normalizedEmail,
    });
    const resetUrl = `${clientUrl}/reset-password/${token}`;

    let emailDelivery = { success: false, messageId: null };

    let emailError = null;

    try {
        emailDelivery = await sendPasswordResetLinkEmail(
            normalizedEmail,
            restaurant.name,
            resetUrl,
        );
    } catch (err) {
        emailError = err.message;
        console.error("[Auth] Password reset email failed:", err.message);
    }

    const emailSent = Boolean(emailDelivery?.success);

    if (!emailSent && process.env.NODE_ENV === "production") {
        throw new AppError(
            emailError ||
                "Unable to send reset email. Check EMAIL_USER and EMAIL_PASS (Gmail app password) in server .env.",
            503,
        );
    }

    const successMessage =
        "Password reset link has been sent to your registered email address. Please check your inbox and follow the instructions to reset your password.";

    return {
        message: emailSent ? successMessage : "Email could not be sent. Please try again later.",
        resetUrl: emailSent ? undefined : resetUrl,
        emailSentTo: normalizedEmail,
        expiresIn: 1800,
        delivery: {
            status: emailSent ? "sent" : "failed",
            messageId: emailDelivery?.messageId || null,
            error: emailSent ? null : emailError,
        },
    };
};

export const resendResetOtp = async (email) => {
    if (!email) {
        throw new AppError("Email is required", 400);
    }

    if (!isEmailValid(email)) {
        throw new AppError("Invalid email", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const restaurant = await Restaurant.findOne({ email: normalizedEmail });

    if (!restaurant) {
        throw new AppError("No account found with this email", 404);
    }

    const cooldown = await checkResendCooldown(normalizedEmail, "reset");
    if (!cooldown.allowed) {
        throw new AppError(
            `Please wait ${cooldown.retryAfter} seconds before requesting another OTP`,
            429,
        );
    }

    const otp = generateOTP();
    await storeResetOTP(normalizedEmail, otp);
    const emailDelivery = await sendPasswordResetOTPEmail(normalizedEmail, restaurant.name, otp);
    await setResendCooldown(normalizedEmail, "reset");

    const otpExpiresIn = await getResetOtpRemainingSeconds(normalizedEmail);

    return {
        message: "A new password reset OTP has been sent to your email.",
        expiresIn: otpExpiresIn || OTP_TTL,
        resendCooldown: RESEND_COOLDOWN_SECONDS,
        retryAfter: RESEND_COOLDOWN_SECONDS,
        otpExpiresAt: new Date(Date.now() + (otpExpiresIn || OTP_TTL) * 1000).toISOString(),
        delivery: {
            status: emailDelivery.success ? "sent" : "unknown",
            messageId: emailDelivery.messageId || null,
        },
    };
};

export const verifyResetOtp = async (email, otp) => {
    if (!email || !otp) {
        throw new AppError("Email and OTP are required", 400);
    }

    if (!isEmailValid(email)) {
        throw new AppError("Invalid email", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const storedOTP = await getResetOTP(normalizedEmail);

    if (!storedOTP) {
        throw new AppError("OTP expired or not found. Please request a new one.", 400);
    }

    if (String(storedOTP) !== otp.trim()) {
        throw new AppError("Invalid OTP", 400);
    }

    const restaurant = await Restaurant.findOne({ email: normalizedEmail });

    if (!restaurant) {
        throw new AppError("No account found with this email", 404);
    }

    await deleteResetOTP(normalizedEmail);

    const resetToken = generateVerificationToken();

    await storeResetToken(resetToken, {
        email: normalizedEmail,
        restaurantId: restaurant.restaurantId,
    });

    return {
        message: "OTP verified successfully",
        resetToken,
    };
};

export const verifyPasswordResetLink = async (token) => {
    const record = await validatePasswordResetToken(token);
    return {
        valid: true,
        email: record.email,
        expiresAt: record.expiresAt,
    };
};

export const resetPassword = async (resetToken, newPassword) => {
    if (!resetToken || !newPassword) {
        throw new AppError("Reset token and new password are required", 400);
    }

    if (!isPasswordValid(newPassword)) {
        throw new AppError(PASSWORD_VALIDATION_MESSAGE, 400);
    }

    const trimmedToken = resetToken.trim();
    const mongoRecord = await PasswordResetToken.findOne({ token: trimmedToken });

    if (mongoRecord) {
        if (mongoRecord.usedAt) {
            throw new AppError("This reset link has already been used.", 400);
        }
        if (mongoRecord.expiresAt <= new Date()) {
            throw new AppError("This reset link has expired.", 400);
        }

        const restaurant = await Restaurant.findOne({ restaurantId: mongoRecord.restaurantId });
        if (!restaurant) throw new AppError("Account not found", 404);

        restaurant.password = await bcrypt.hash(newPassword, 10);
        await restaurant.save();
        await consumePasswordResetToken(trimmedToken);

        const { accessToken, refreshToken } = generateAuthTokens(restaurant.restaurantId);

        return {
            message: "Password updated successfully.",
            accessToken,
            refreshToken,
            restaurant: formatRestaurantProfile(restaurant),
        };
    }

    const tokenData = await getResetTokenData(resetToken);

    if (!tokenData) {
        throw new AppError("Invalid or expired reset token", 400);
    }

    const restaurant = await Restaurant.findOne({ restaurantId: tokenData.restaurantId });

    if (!restaurant) {
        throw new AppError("Account not found", 404);
    }

    restaurant.password = await bcrypt.hash(newPassword, 10);
    await restaurant.save();
    await deleteResetToken(resetToken);

    return { message: "Password reset successfully" };
};

export const changePassword = async (restaurant, currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) {
        throw new AppError("Current password and new password are required", 400);
    }

    if (!isPasswordValid(newPassword)) {
        throw new AppError(PASSWORD_VALIDATION_MESSAGE, 400);
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, restaurant.password);

    if (!isCurrentPasswordValid) {
        throw new AppError("Current password is incorrect", 400);
    }

    if (currentPassword === newPassword) {
        throw new AppError("New password must be different from current password", 400);
    }

    restaurant.password = await bcrypt.hash(newPassword, 10);
    await restaurant.save();

    return { message: "Password changed successfully" };
};
