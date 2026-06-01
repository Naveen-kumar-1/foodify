import { AppError } from "../middleware/errorHandler.js";
import { ALLOWED_GST_PERCENTAGES } from "../utils/orderTotals.js";

const SORT_OPTIONS = {
    latest: { sortBy: "createdAt", sortOrder: -1 },
    oldest: { sortBy: "createdAt", sortOrder: 1 },
    "price-asc": { sortBy: "price", sortOrder: 1 },
    "price-desc": { sortBy: "price", sortOrder: -1 },
    "name-az": { sortBy: "foodName", sortOrder: 1 },
};

const normalizeFoodPayload = (body, { isUpdate = false } = {}) => {
    const payload = {};

    if (body.foodName !== undefined || !isUpdate) {
        const foodName = body.foodName?.trim();
        if (!foodName) {
            throw new AppError("Food name is required", 400);
        }
        payload.foodName = foodName;
    }

    if (body.description !== undefined || !isUpdate) {
        payload.description = body.description?.trim() || "";
    }

    if (body.price !== undefined || !isUpdate) {
        const price = Number(body.price);
        if (!Number.isFinite(price) || price <= 0) {
            throw new AppError("Price must be a number greater than 0", 400);
        }
        payload.price = price;
    }

    if (body.gstPercentage !== undefined || !isUpdate) {
        const gstPercentage = Number(body.gstPercentage);
        if (!ALLOWED_GST_PERCENTAGES.includes(gstPercentage)) {
            throw new AppError("GST percentage must be 0, 5, 12, 18, or 28", 400);
        }
        payload.gstPercentage = gstPercentage;
    } else if (!isUpdate) {
        payload.gstPercentage = 5;
    }

    if (body.isTimeSlotBased !== undefined || !isUpdate) {
        payload.isTimeSlotBased = Boolean(body.isTimeSlotBased);
    }

    if (body.isActive !== undefined) {
        payload.isActive = Boolean(body.isActive);
    }

    const isTimeSlotBased =
        payload.isTimeSlotBased !== undefined
            ? payload.isTimeSlotBased
            : body.isTimeSlotBased;

    if (isTimeSlotBased) {
        const timeSlotId = body.timeSlotId?.trim();
        if (!timeSlotId) {
            throw new AppError("timeSlotId is required for time slot based foods", 400);
        }
        payload.timeSlotId = timeSlotId;
        payload.isTimeSlotBased = true;
    } else if (
        body.isTimeSlotBased !== undefined ||
        body.timeSlotId !== undefined ||
        !isUpdate
    ) {
        payload.isTimeSlotBased = false;
        payload.timeSlotId = null;
    }

    return payload;
};

export const validateCreateMenuBody = (body) => normalizeFoodPayload(body);

export const validateUpdateMenuBody = (body) => {
    const payload = normalizeFoodPayload(body, { isUpdate: true });

    if (!Object.keys(payload).length) {
        throw new AppError("No valid fields provided for update", 400);
    }

    return payload;
};

export const validateToggleMenuStatusBody = (body) => {
    if (body.isActive === undefined) {
        throw new AppError("isActive is required", 400);
    }
    return { isActive: Boolean(body.isActive) };
};

export const validateListMenuQuery = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const search = query.search?.trim() || "";
    const type = ["all-day", "time-slot", "all"].includes(query.type) ? query.type : "all";
    const status = ["active", "inactive", "all"].includes(query.status)
        ? query.status
        : "all";
    const sortKey = SORT_OPTIONS[query.sort] ? query.sort : "latest";
    const { sortBy, sortOrder } = SORT_OPTIONS[sortKey];

    return { page, limit, search, type, status, sortBy, sortOrder, sortKey };
};
