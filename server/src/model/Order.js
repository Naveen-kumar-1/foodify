import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        foodId: { type: String, required: true },
        foodName: { type: String, required: true },
        description: { type: String, default: "" },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        gstPercentage: { type: Number, default: 5 },
        gstAmount: { type: Number, default: 0 },
        lineTotal: { type: Number, required: true },
    },
    { _id: false },
);

const orderSchema = new mongoose.Schema(
    {
        orderId: { type: String, required: true, unique: true },
        orderNumber: { type: String, required: true },
        restaurantId: { type: String, required: true, index: true },
        tableId: { type: String, required: true, index: true },
        customerSessionId: { type: String, required: true, index: true },
        items: { type: [orderItemSchema], required: true },
        subtotal: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        total: { type: Number, required: true },
        couponCode: { type: String, default: null },
        paymentMethod: {
            type: String,
            enum: ["cash", "pay_later", "online"],
            default: "pay_later",
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "not_required"],
            default: "not_required",
        },
        orderStatus: {
            type: String,
            enum: ["placed", "preparing", "ready", "served", "completed", "cancelled"],
            default: "placed",
            index: true,
        },
        notes: { type: String, default: "" },
        statusHistory: {
            type: [
                {
                    status: String,
                    at: { type: Date, default: Date.now },
                },
            ],
            default: [],
        },
    },
    { timestamps: true },
);

orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, orderStatus: 1 });
orderSchema.index({ restaurantId: 1, orderNumber: 1 });

export default mongoose.model("Order", orderSchema, "orders");
