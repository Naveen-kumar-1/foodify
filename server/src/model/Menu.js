import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
    {
        foodId: {
            type: String,
            required: true,
            unique: true,
        },
        restaurantId: {
            type: String,
            required: true,
            index: true,
        },
        foodName: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0.01,
        },
        gstPercentage: {
            type: Number,
            enum: [0, 5, 12, 18, 28],
            default: 5,
        },
        isTimeSlotBased: {
            type: Boolean,
            default: false,
        },
        timeSlotId: {
            type: String,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

menuSchema.index({ restaurantId: 1, foodName: 1 });
menuSchema.index({ restaurantId: 1, isActive: 1 });
menuSchema.index({ restaurantId: 1, isTimeSlotBased: 1 });
menuSchema.index({ restaurantId: 1, timeSlotId: 1 });
menuSchema.index({ restaurantId: 1, createdAt: -1 });

export default mongoose.model("Menu", menuSchema, "menus");
