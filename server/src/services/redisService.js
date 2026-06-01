import crypto from "crypto";
import getRedisClient from "../config/redis.js";
import { EMAIL_CONFIG } from "../config/emailConfig.js";

export const OTP_TTL = EMAIL_CONFIG.OTP_TTL_SECONDS;
export const VERIFICATION_TOKEN_TTL = 900;
export const SIGNUP_DATA_TTL = 900;
export const RESET_TOKEN_TTL = 900;
export const RESEND_COOLDOWN_SECONDS = EMAIL_CONFIG.RESEND_COOLDOWN_SECONDS;

const otpKey = (email) => `otp:${email.toLowerCase()}`;
const resendCooldownKey = (email, type) => `resend:${type}:${email.toLowerCase()}`;
const signupKey = (email) => `signup:${email.toLowerCase()}`;
const verificationKey = (token) => `verification:${token}`;
const resetOtpKey = (email) => `reset-otp:${email.toLowerCase()}`;
const resetTokenKey = (token) => `reset:${token}`;

const parseStoredData = (data) => {
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data;
};

export const generateOTP = () => crypto.randomInt(100000, 999999).toString();

export const storeOTP = async (email, otp) => {
    await getRedisClient().set(otpKey(email), otp, { ex: OTP_TTL });
};

export const getOTP = async (email) => {
    return getRedisClient().get(otpKey(email));
};

export const deleteOTP = async (email) => {
    await getRedisClient().del(otpKey(email));
};

export const storeSignupData = async (email, data) => {
    await getRedisClient().set(signupKey(email), JSON.stringify(data), { ex: SIGNUP_DATA_TTL });
};

export const getSignupData = async (email) => {
    const data = await getRedisClient().get(signupKey(email));
    return parseStoredData(data);
};

export const deleteSignupData = async (email) => {
    await getRedisClient().del(signupKey(email));
};

export const storeVerificationToken = async (token, data) => {
    await getRedisClient().set(verificationKey(token), JSON.stringify(data), { ex: VERIFICATION_TOKEN_TTL });
};

export const getVerificationTokenData = async (token) => {
    const data = await getRedisClient().get(verificationKey(token));
    return parseStoredData(data);
};

export const deleteVerificationToken = async (token) => {
    await getRedisClient().del(verificationKey(token));
};

export const storeResetOTP = async (email, otp) => {
    await getRedisClient().set(resetOtpKey(email), otp, { ex: OTP_TTL });
};

export const getResetOTP = async (email) => {
    return getRedisClient().get(resetOtpKey(email));
};

export const deleteResetOTP = async (email) => {
    await getRedisClient().del(resetOtpKey(email));
};

export const storeResetToken = async (token, data) => {
    await getRedisClient().set(resetTokenKey(token), JSON.stringify(data), { ex: RESET_TOKEN_TTL });
};

export const getResetTokenData = async (token) => {
    const data = await getRedisClient().get(resetTokenKey(token));
    return parseStoredData(data);
};

export const deleteResetToken = async (token) => {
    await getRedisClient().del(resetTokenKey(token));
};

export const getKeyTtlSeconds = async (key) => {
    const ttl = await getRedisClient().ttl(key);
    return ttl > 0 ? ttl : 0;
};

export const getOtpRemainingSeconds = async (email) => getKeyTtlSeconds(otpKey(email));

export const getResetOtpRemainingSeconds = async (email) => getKeyTtlSeconds(resetOtpKey(email));

export const checkResendCooldown = async (email, type = "signup") => {
    const key = resendCooldownKey(email, type);
    const retryAfter = await getKeyTtlSeconds(key);
    return {
        allowed: retryAfter === 0,
        retryAfter,
    };
};

export const setResendCooldown = async (email, type = "signup") => {
    await getRedisClient().set(resendCooldownKey(email, type), "1", {
        ex: RESEND_COOLDOWN_SECONDS,
    });
};
