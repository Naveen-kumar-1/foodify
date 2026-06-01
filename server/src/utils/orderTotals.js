import { AppError } from "../middleware/errorHandler.js";

export const ALLOWED_GST_PERCENTAGES = [0, 5, 12, 18, 28];

export const normalizeGstPercentage = (value) => {
    const n = Number(value);
    if (ALLOWED_GST_PERCENTAGES.includes(n)) return n;
    return 5;
};

export const buildOrderLinesFromMenu = (payloadItems, menuMap) => {
    const lines = [];

    for (const item of payloadItems) {
        const food = menuMap.get(item.foodId);
        if (!food) throw new AppError(`Item ${item.foodId} is not available`, 400);

        const gstPercentage = normalizeGstPercentage(food.gstPercentage);
        const lineSubtotal = food.price * item.quantity;

        lines.push({
            foodId: food.foodId,
            foodName: food.foodName,
            description: food.description || "",
            price: food.price,
            quantity: item.quantity,
            gstPercentage,
            lineSubtotal,
        });
    }

    return lines;
};

export const calculateOrderTotals = (lines, discount = 0) => {
    const grossSubtotal = lines.reduce((sum, line) => sum + line.lineSubtotal, 0);
    const cappedDiscount = Math.min(Math.max(0, discount), grossSubtotal);

    const items = lines.map((line) => {
        const share = grossSubtotal > 0 ? line.lineSubtotal / grossSubtotal : 0;
        const lineDiscount = cappedDiscount * share;
        const taxable = line.lineSubtotal - lineDiscount;
        const gstAmount = Math.round((taxable * line.gstPercentage) / 100);
        const lineTotal = taxable + gstAmount;

        return {
            foodId: line.foodId,
            foodName: line.foodName,
            description: line.description,
            price: line.price,
            quantity: line.quantity,
            gstPercentage: line.gstPercentage,
            lineSubtotal: line.lineSubtotal,
            gstAmount,
            lineTotal,
        };
    });

    const subtotal = grossSubtotal;
    const tax = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const total = subtotal - cappedDiscount + tax;

    return { items, subtotal, discount: cappedDiscount, tax, total };
};
