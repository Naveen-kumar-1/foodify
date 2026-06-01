import { v4 as uuidv4 } from "uuid";
import Coupon from "../model/Coupon.js";
import { AppError } from "../middleware/errorHandler.js";

export const seedDefaultCoupons = async (restaurantId) => {
    const defaults = [
        { code: "WELCOME10", discountType: "percent", discountValue: 10, minOrderAmount: 100 },
        { code: "FLAT50", discountType: "fixed", discountValue: 50, minOrderAmount: 200 },
    ];

    for (const c of defaults) {
        const exists = await Coupon.findOne({ restaurantId, code: c.code });
        if (!exists) {
            await Coupon.create({ couponId: uuidv4(), restaurantId, ...c, isActive: true });
        }
    }
};

export const validateCoupon = async (restaurantId, code, subtotal) => {
    await seedDefaultCoupons(restaurantId);

    const coupon = await Coupon.findOne({
        restaurantId,
        code: code.toUpperCase(),
        isActive: true,
    });

    if (!coupon) {
        throw new AppError("Invalid coupon code", 400);
    }

    if (subtotal < coupon.minOrderAmount) {
        throw new AppError(
            `Minimum order amount ₹${coupon.minOrderAmount} required for this coupon`,
            400,
        );
    }

    let discount = 0;
    if (coupon.discountType === "percent") {
        discount = Math.round((subtotal * coupon.discountValue) / 100);
    } else {
        discount = coupon.discountValue;
    }

    discount = Math.min(discount, subtotal);

    return {
        valid: true,
        message: "Coupon applied successfully",
        code: coupon.code,
        discount,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
    };
};
