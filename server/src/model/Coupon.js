import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        couponId: { type: String, required: true, unique: true },
        restaurantId: { type: String, required: true, index: true },
        code: { type: String, required: true, trim: true, uppercase: true },
        discountType: { type: String, enum: ["percent", "fixed"], required: true },
        discountValue: { type: Number, required: true, min: 0 },
        minOrderAmount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true },
);

couponSchema.index({ restaurantId: 1, code: 1 }, { unique: true });

export default mongoose.model("Coupon", couponSchema, "coupons");
