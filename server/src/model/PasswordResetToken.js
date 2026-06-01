import mongoose from "mongoose";

const passwordResetTokenSchema = new mongoose.Schema(
    {
        token: { type: String, required: true, unique: true, index: true },
        restaurantId: { type: String, required: true, index: true },
        email: { type: String, required: true, lowercase: true },
        expiresAt: { type: Date, required: true, index: true },
        usedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model(
    "PasswordResetToken",
    passwordResetTokenSchema,
    "password_reset_tokens",
);
