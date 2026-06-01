import { v4 as uuidv4 } from "uuid";
import TimeSlot from "../model/TimeSlot.js";
import { AppError } from "../middleware/errorHandler.js";

const sanitizeTimeSlot = (slot) => ({
    slotId: slot.slotId,
    restaurantId: slot.restaurantId,
    slotName: slot.slotName,
    fromTime: slot.fromTime,
    toTime: slot.toTime,
    isActive: slot.isActive,
    createdAt: slot.createdAt,
    updatedAt: slot.updatedAt,
});

const buildListFilter = (restaurantId, { search, status }) => {
    const filter = { restaurantId };

    if (search) {
        filter.slotName = { $regex: search, $options: "i" };
    }

    if (status === "active") {
        filter.isActive = true;
    }

    if (status === "inactive") {
        filter.isActive = false;
    }

    return filter;
};

export const createTimeSlot = async (restaurantId, payload) => {
    const slot = await TimeSlot.create({
        slotId: uuidv4(),
        restaurantId,
        ...payload,
    });

    return sanitizeTimeSlot(slot);
};

export const getTimeSlots = async (restaurantId, query) => {
    const filter = buildListFilter(restaurantId, query);
    const skip = (query.page - 1) * query.limit;
    const sort = { [query.sortBy]: query.sortOrder };

    const [slots, total] = await Promise.all([
        TimeSlot.find(filter).sort(sort).skip(skip).limit(query.limit),
        TimeSlot.countDocuments(filter),
    ]);

    return {
        data: slots.map(sanitizeTimeSlot),
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit) || 1,
        },
    };
};

export const getTimeSlotById = async (restaurantId, slotId) => {
    const slot = await TimeSlot.findOne({ restaurantId, slotId });

    if (!slot) {
        throw new AppError("Time slot not found", 404);
    }

    return sanitizeTimeSlot(slot);
};

export const updateTimeSlot = async (restaurantId, slotId, payload) => {
    const slot = await TimeSlot.findOneAndUpdate(
        { restaurantId, slotId },
        { $set: payload },
        { new: true, runValidators: true },
    );

    if (!slot) {
        throw new AppError("Time slot not found", 404);
    }

    return sanitizeTimeSlot(slot);
};

export const deleteTimeSlot = async (restaurantId, slotId) => {
    const slot = await TimeSlot.findOneAndDelete({ restaurantId, slotId });

    if (!slot) {
        throw new AppError("Time slot not found", 404);
    }

    return { message: "Time slot deleted successfully" };
};

export const toggleTimeSlotStatus = async (restaurantId, slotId, isActive) => {
    const slot = await TimeSlot.findOneAndUpdate(
        { restaurantId, slotId },
        { $set: { isActive } },
        { new: true },
    );

    if (!slot) {
        throw new AppError("Time slot not found", 404);
    }

    return sanitizeTimeSlot(slot);
};
