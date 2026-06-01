import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
    {
        tableId: { type: String, required: true, unique: true },
        restaurantId: { type: String, required: true, index: true },
        tableName: { type: String, required: true, trim: true },
        tableNumber: { type: String, required: true, trim: true },
        qrToken: { type: String, required: true, unique: true, index: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true },
);

tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

export default mongoose.model("Table", tableSchema, "tables");
