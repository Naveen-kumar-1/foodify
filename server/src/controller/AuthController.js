import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import Restaurant from "../model/Restaurant.js";
import { AppError } from "../middleware/errorHandler.js";
import {
    formatRestaurantProfile,
    generateAuthTokens,
    generateVerificationToken,
    sanitizeRestaurant,
} from "../helpers/auth.js";
import { isEmailValid, isPasswordValid, PASSWORD_VALIDATION_MESSAGE } from "../helpers/common.js";
import { sendOTPEmail } from "../services/emailService.js";
import * as passwordService from "../services/authService.js";
import {
    checkResendCooldown,
    deleteOTP,
    deleteSignupData,
    deleteVerificationToken,
    generateOTP,
    getOTP,
    getOtpRemainingSeconds,
    getSignupData,
    getVerificationTokenData,
    OTP_TTL,
    RESEND_COOLDOWN_SECONDS,
    setResendCooldown,
    storeOTP,
    storeSignupData,
    storeVerificationToken,
} from "../services/redisService.js";

const buildOtpDeliveryPayload = (remainingSeconds = OTP_TTL, emailDelivery = {}) => ({
    expiresIn: remainingSeconds,
    resendCooldown: RESEND_COOLDOWN_SECONDS,
    otpExpiresAt: new Date(Date.now() + remainingSeconds * 1000).toISOString(),
    delivery: {
        status: emailDelivery.success ? "sent" : "unknown",
        messageId: emailDelivery.messageId || null,
        attempt: emailDelivery.attempt || null,
        durationMs: emailDelivery.durationMs || null,
    },
});

export const signup = async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
        throw new AppError("Name and email are required", 400);
    }

    if (!isEmailValid(email)) {
        throw new AppError("Invalid email", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingRestaurant = await Restaurant.findOne({ email: normalizedEmail });

    if (existingRestaurant) {
        throw new AppError("Email already registered", 400);
    }

    const otp = generateOTP();

    await Promise.all([
        storeOTP(normalizedEmail, otp),
        storeSignupData(normalizedEmail, { name: name.trim(), email: normalizedEmail }),
    ]);

    const emailDelivery = await sendOTPEmail(normalizedEmail, name.trim(), otp);

    const otpExpiresIn = await getOtpRemainingSeconds(normalizedEmail);

    res.status(200).json({
        message: "OTP sent to your email. Please verify to continue.",
        ...buildOtpDeliveryPayload(otpExpiresIn || OTP_TTL, emailDelivery),
    });
};

export const resendOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new AppError("Email is required", 400);
    }

    if (!isEmailValid(email)) {
        throw new AppError("Invalid email", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const signupData = await getSignupData(normalizedEmail);

    if (!signupData) {
        throw new AppError("Signup session expired. Please sign up again.", 400);
    }

    const existingRestaurant = await Restaurant.findOne({ email: normalizedEmail });
    if (existingRestaurant) {
        throw new AppError("Email already registered", 400);
    }

    const cooldown = await checkResendCooldown(normalizedEmail, "signup");
    if (!cooldown.allowed) {
        throw new AppError(
            `Please wait ${cooldown.retryAfter} seconds before requesting another OTP`,
            429,
        );
    }

    const otp = generateOTP();
    await storeOTP(normalizedEmail, otp);
    const emailDelivery = await sendOTPEmail(normalizedEmail, signupData.name, otp);
    await setResendCooldown(normalizedEmail, "signup");

    const otpExpiresIn = await getOtpRemainingSeconds(normalizedEmail);

    res.status(200).json({
        message: "A new OTP has been sent to your email.",
        retryAfter: RESEND_COOLDOWN_SECONDS,
        ...buildOtpDeliveryPayload(otpExpiresIn || OTP_TTL, emailDelivery),
    });
};

export const getOtpStatus = async (req, res) => {
    const { email } = req.query;

    if (!email || !isEmailValid(email)) {
        throw new AppError("Valid email is required", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpExpiresIn = await getOtpRemainingSeconds(normalizedEmail);
    const cooldown = await checkResendCooldown(normalizedEmail, "signup");

    res.status(200).json({
        hasActiveOtp: otpExpiresIn > 0,
        otpExpiresIn,
        canResend: cooldown.allowed,
        resendRetryAfter: cooldown.retryAfter,
        resendCooldown: RESEND_COOLDOWN_SECONDS,
    });
};

export const verifyEmail = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new AppError("Email and OTP are required", 400);
    }

    if (!isEmailValid(email)) {
        throw new AppError("Invalid email", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const storedOTP = await getOTP(normalizedEmail);

    if (!storedOTP) {
        const otpExpiresIn = await getOtpRemainingSeconds(normalizedEmail);
        throw new AppError(
            otpExpiresIn === 0
                ? "OTP expired. Please request a new code."
                : "OTP not found. Please request a new code.",
            400,
        );
    }

    if (String(storedOTP) !== otp.trim()) {
        throw new AppError("Invalid OTP", 400);
    }

    const signupData = await getSignupData(normalizedEmail);

    if (!signupData) {
        throw new AppError("Signup session expired. Please sign up again.", 400);
    }

    await deleteOTP(normalizedEmail);

    const verificationToken = generateVerificationToken();

    await storeVerificationToken(verificationToken, {
        name: signupData.name,
        email: normalizedEmail,
        isEmailVerified: true,
    });

    res.status(200).json({
        message: "Email verified successfully",
        verificationToken,
    });
};

export const setPassword = async (req, res) => {
    const { verificationToken, password } = req.body;

    if (!verificationToken || !password) {
        throw new AppError("Verification token and password are required", 400);
    }

    if (!isPasswordValid(password)) {
        throw new AppError(PASSWORD_VALIDATION_MESSAGE, 400);
    }

    const tokenData = await getVerificationTokenData(verificationToken);

    if (!tokenData) {
        throw new AppError("Invalid or expired verification token", 400);
    }

    if (!tokenData.isEmailVerified) {
        throw new AppError("Email not verified", 400);
    }

    const existingRestaurant = await Restaurant.findOne({ email: tokenData.email });

    if (existingRestaurant) {
        throw new AppError("Email already registered", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const restaurant = await Restaurant.create({
        restaurantId: uuidv4(),
        name: tokenData.name,
        email: tokenData.email,
        password: hashedPassword,
        isEmailVerified: true,
    });

    await deleteVerificationToken(verificationToken);
    await deleteSignupData(tokenData.email);

    const { accessToken, refreshToken } = generateAuthTokens(restaurant.restaurantId);

    res.status(201).json({
        message: "Registration completed successfully",
        accessToken,
        refreshToken,
        restaurant: formatRestaurantProfile(restaurant),
    });
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError("Email and password are required", 400);
    }

    if (!isEmailValid(email)) {
        throw new AppError("Invalid email", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const restaurant = await Restaurant.findOne({ email: normalizedEmail });

    if (!restaurant) {
        throw new AppError("Invalid email or password", 401);
    }

    if (!restaurant.isEmailVerified) {
        throw new AppError("Email not verified. Please complete registration.", 403);
    }

    const isPasswordCorrect = await bcrypt.compare(password, restaurant.password);

    if (!isPasswordCorrect) {
        throw new AppError("Invalid email or password", 401);
    }

    const { accessToken, refreshToken } = generateAuthTokens(restaurant.restaurantId);

    res.status(200).json({
        message: "Login successful",
        accessToken,
        refreshToken,
        restaurant: formatRestaurantProfile(restaurant),
    });
};

export const forgotPassword = async (req, res) => {
    const email = req.body?.email;
    if (!email || typeof email !== "string") {
        throw new AppError("Email is required", 400);
    }
    const result = await passwordService.forgotPassword(email);
    res.status(200).json(result);
};

export const verifyResetToken = async (req, res) => {
    const token = req.query.token || req.body.token;
    const result = await passwordService.verifyPasswordResetLink(token);
    res.status(200).json(result);
};

export const resendResetOtp = async (req, res) => {
    const result = await passwordService.resendResetOtp(req.body.email);
    res.status(200).json(result);
};

export const verifyResetOtp = async (req, res) => {
    const { email, otp } = req.body;
    const result = await passwordService.verifyResetOtp(email, otp);
    res.status(200).json(result);
};

export const resetPassword = async (req, res) => {
    const { resetToken, newPassword } = req.body;
    const result = await passwordService.resetPassword(resetToken, newPassword);
    res.status(200).json(result);
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await passwordService.changePassword(req.restaurant, currentPassword, newPassword);
    res.status(200).json(result);
};
