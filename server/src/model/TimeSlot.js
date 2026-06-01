import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema(
    {
        slotId: {
            type: String,
            required: true,
            unique: true,
        },
        restaurantId: {
            type: String,
            required: true,
            index: true,
        },
        slotName: {
            type: String,
            required: true,
            trim: true,
        },
        fromTime: {
            type: String,
            required: true,
        },
        toTime: {
            type: String,
            required: true,
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

timeSlotSchema.index({ restaurantId: 1, slotName: 1 });
timeSlotSchema.index({ restaurantId: 1, createdAt: -1 });

export default mongoose.model("TimeSlot", timeSlotSchema, "timeslots");
