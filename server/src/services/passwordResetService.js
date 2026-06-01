import crypto from "crypto";
import PasswordResetToken from "../model/PasswordResetToken.js";
import { AppError } from "../middleware/errorHandler.js";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export const createPasswordResetToken = async ({ restaurantId, email }) => {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await PasswordResetToken.updateMany(
        { restaurantId, usedAt: null },
        { $set: { usedAt: new Date() } },
    );

    await PasswordResetToken.create({
        token,
        restaurantId,
        email: email.toLowerCase().trim(),
        expiresAt,
    });

    return { token, expiresAt };
};

export const validatePasswordResetToken = async (token) => {
    if (!token) throw new AppError("Reset token is required", 400);

    const trimmed = token.trim();
    const record = await PasswordResetToken.findOne({ token: trimmed });

    if (!record) {
        throw new AppError("This reset link is invalid.", 400);
    }

    if (record.usedAt) {
        throw new AppError("This reset link has already been used.", 400);
    }

    if (record.expiresAt <= new Date()) {
        throw new AppError("This reset link has expired.", 400);
    }

    return record;
};

export const consumePasswordResetToken = async (token) => {
    const record = await validatePasswordResetToken(token);
    record.usedAt = new Date();
    await record.save();
    return record;
};
