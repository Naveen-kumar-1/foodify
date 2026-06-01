import { AppError } from "../middleware/errorHandler.js";

export const ORDER_STATUSES = [
    "placed",
    "confirmed",
    "preparing",
    "ready",
    "served",
    "completed",
    "cancelled",
];

export const CUSTOMER_CANCELLABLE_STATUSES = ["placed", "confirmed"];

export const STAFF_CANCELLABLE_STATUSES = ["placed", "confirmed", "preparing"];

const KITCHEN_TRANSITIONS = {
    placed: ["confirmed", "preparing", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["served", "cancelled"],
    served: ["completed"],
    completed: [],
    cancelled: [],
};

export const canCustomerCancelOrder = (status) => CUSTOMER_CANCELLABLE_STATUSES.includes(status);

export const canStaffCancelOrder = (status) => STAFF_CANCELLABLE_STATUSES.includes(status);

export const validateOrderItems = (items) => {
    if (!Array.isArray(items) || !items.length) {
        throw new AppError("Order must contain at least one item", 400);
    }

    return items.map((item) => {
        const foodId = item.foodId?.trim();
        const quantity = Number(item.quantity);
        if (!foodId) throw new AppError("Each item must have a foodId", 400);
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new AppError("Quantity must be at least 1", 400);
        }
        return { foodId, quantity };
    });
};

export const validatePlaceOrderBody = (body) => {
    const isPreview = body.customerSessionId === "preview";
    if (!isPreview && !body.customerSessionId?.trim()) {
        throw new AppError("customerSessionId is required", 400);
    }
    const items = validateOrderItems(body.items);
    const paymentMethod = body.paymentMethod || "pay_later";
    if (!["cash", "pay_later", "online"].includes(paymentMethod)) {
        throw new AppError("Invalid payment method", 400);
    }
    if (paymentMethod === "online") {
        throw new AppError("Online payment coming soon. Please use Pay After Food Delivery.", 400);
    }
    return {
        customerSessionId: isPreview ? "preview" : body.customerSessionId.trim(),
        items,
        couponCode: body.couponCode?.trim().toUpperCase() || null,
        paymentMethod: paymentMethod === "cash" ? "cash" : "pay_later",
        notes: body.notes?.trim() || "",
    };
};

export const validateStatusUpdate = (currentStatus, nextStatus) => {
    if (!ORDER_STATUSES.includes(nextStatus)) {
        throw new AppError("Invalid order status", 400);
    }
    const allowed = KITCHEN_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
        throw new AppError(`Cannot change status from ${currentStatus} to ${nextStatus}`, 400);
    }
};

export const validateCancelOrderBody = (body, { requireReason = false } = {}) => {
    const reason = body.cancellationReason?.trim() || body.reason?.trim() || "";
    if (requireReason && !reason) {
        throw new AppError("Cancellation reason is required", 400);
    }
    const cancelledBy = body.cancelledBy || "kitchen";
    if (!["kitchen", "admin"].includes(cancelledBy)) {
        throw new AppError("Invalid cancelledBy value", 400);
    }
    return { reason, cancelledBy };
};

export const validateKitchenListQuery = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(30, Math.max(1, parseInt(query.limit, 10) || 10));
    const search = query.search?.trim() || "";
    const status = ORDER_STATUSES.includes(query.status) ? query.status : "active";
    const sort = query.sort === "oldest" ? "oldest" : "latest";
    return { page, limit, search, status, sort };
};

export const validateListOrdersQuery = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const search = query.search?.trim() || "";
    const status = ORDER_STATUSES.includes(query.status) ? query.status : "all";
    const todayOnly = query.today === "true";
    return { page, limit, search, status, todayOnly };
};

export const validateCouponBody = (body) => {
    const code = body.code?.trim();
    const subtotal = Number(body.subtotal);
    if (!code) throw new AppError("Coupon code is required", 400);
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
        throw new AppError("Valid subtotal is required", 400);
    }
    return { code: code.toUpperCase(), subtotal };
};
