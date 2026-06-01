import { AppError } from "../middleware/errorHandler.js";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const parseTimeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
};

export const normalizeTime = (time) => {
    if (typeof time !== "string") return null;
    const trimmed = time.trim();
    if (!TIME_PATTERN.test(trimmed)) return null;
    return trimmed;
};

export const validateTimeRange = (fromTime, toTime) => {
    const normalizedFrom = normalizeTime(fromTime);
    const normalizedTo = normalizeTime(toTime);

    if (!normalizedFrom) {
        throw new AppError("Invalid fromTime. Use HH:mm format (24-hour)", 400);
    }

    if (!normalizedTo) {
        throw new AppError("Invalid toTime. Use HH:mm format (24-hour)", 400);
    }

    const fromMinutes = parseTimeToMinutes(normalizedFrom);
    const toMinutes = parseTimeToMinutes(normalizedTo);

    if (fromMinutes >= toMinutes) {
        throw new AppError("fromTime must be earlier than toTime", 400);
    }

    return {
        fromTime: normalizedFrom,
        toTime: normalizedTo,
    };
};

export const validateCreateTimeSlotBody = (body) => {
    const slotName = body?.slotName?.trim();

    if (!slotName) {
        throw new AppError("Slot name is required", 400);
    }

    const { fromTime, toTime } = validateTimeRange(body.fromTime, body.toTime);

    return {
        slotName,
        fromTime,
        toTime,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    };
};

export const validateUpdateTimeSlotBody = (body) => {
    const payload = {};

    if (body.slotName !== undefined) {
        const slotName = body.slotName?.trim();
        if (!slotName) {
            throw new AppError("Slot name cannot be empty", 400);
        }
        payload.slotName = slotName;
    }

    if (body.fromTime !== undefined || body.toTime !== undefined) {
        if (body.fromTime === undefined || body.toTime === undefined) {
            throw new AppError("Both fromTime and toTime are required when updating time range", 400);
        }
        const range = validateTimeRange(body.fromTime, body.toTime);
        payload.fromTime = range.fromTime;
        payload.toTime = range.toTime;
    }

    if (body.isActive !== undefined) {
        payload.isActive = Boolean(body.isActive);
    }

    if (!Object.keys(payload).length) {
        throw new AppError("No valid fields provided for update", 400);
    }

    return payload;
};

export const validateToggleStatusBody = (body) => {
    if (body.isActive === undefined) {
        throw new AppError("isActive is required", 400);
    }
    return { isActive: Boolean(body.isActive) };
};

export const validateListQuery = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const search = query.search?.trim() || "";
    const sortBy = ["slotName", "fromTime", "createdAt"].includes(query.sortBy)
        ? query.sortBy
        : "createdAt";
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;
    const status = ["active", "inactive", "all"].includes(query.status)
        ? query.status
        : "all";

    return { page, limit, search, sortBy, sortOrder, status };
};
