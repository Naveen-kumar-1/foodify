import { v4 as uuidv4 } from "uuid";
import Menu from "../model/Menu.js";
import TimeSlot from "../model/TimeSlot.js";
import { AppError } from "../middleware/errorHandler.js";
import { parseTimeToMinutes } from "../validations/timeSlotValidation.js";

const getAppTimeZone = () => process.env.APP_TIMEZONE || process.env.TZ || "Asia/Kolkata";

const getTimePartsInZone = (date, timeZone) => {
    // hour/minute in the target zone (serverless is often UTC, which breaks slot logic)
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(date);

    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    return { hour, minute };
};

const getCurrentMinutes = () => {
    const now = new Date();
    const tz = getAppTimeZone();
    try {
        const { hour, minute } = getTimePartsInZone(now, tz);
        return hour * 60 + minute;
    } catch {
        // Fallback to server timezone if Intl/timeZone is misconfigured
        return now.getHours() * 60 + now.getMinutes();
    }
};

const isWithinTimeSlot = (slot, currentMinutes) => {
    const from = parseTimeToMinutes(slot.fromTime);
    const to = parseTimeToMinutes(slot.toTime);
    return currentMinutes >= from && currentMinutes <= to;
};

const buildListFilter = (restaurantId, { search, type, status }) => {
    const filter = { restaurantId };

    if (search) {
        filter.foodName = { $regex: search, $options: "i" };
    }

    if (type === "all-day") {
        filter.isTimeSlotBased = false;
    }

    if (type === "time-slot") {
        filter.isTimeSlotBased = true;
    }

    if (status === "active") {
        filter.isActive = true;
    }

    if (status === "inactive") {
        filter.isActive = false;
    }

    return filter;
};

const fetchTimeSlotMap = async (restaurantId, slotIds) => {
    const uniqueIds = [...new Set(slotIds.filter(Boolean))];
    if (!uniqueIds.length) return new Map();

    const slots = await TimeSlot.find({
        restaurantId,
        slotId: { $in: uniqueIds },
    });

    return new Map(slots.map((slot) => [slot.slotId, slot]));
};

const sanitizeMenuItem = (food, slotMap = new Map()) => {
    const slot = food.timeSlotId ? slotMap.get(food.timeSlotId) : null;

    return {
        foodId: food.foodId,
        restaurantId: food.restaurantId,
        foodName: food.foodName,
        description: food.description,
        price: food.price,
        gstPercentage: food.gstPercentage ?? 5,
        isTimeSlotBased: food.isTimeSlotBased,
        timeSlotId: food.timeSlotId,
        isActive: food.isActive,
        createdAt: food.createdAt,
        updatedAt: food.updatedAt,
        timeSlot: slot
            ? {
                  slotId: slot.slotId,
                  slotName: slot.slotName,
                  fromTime: slot.fromTime,
                  toTime: slot.toTime,
                  isActive: slot.isActive,
              }
            : null,
    };
};

export const assertTimeSlotForRestaurant = async (restaurantId, timeSlotId) => {
    const slot = await TimeSlot.findOne({ restaurantId, slotId: timeSlotId, isActive: true });

    if (!slot) {
        throw new AppError("Valid active time slot not found for this restaurant", 400);
    }

    return slot;
};

export const createMenuItem = async (restaurantId, payload) => {
    if (payload.isTimeSlotBased) {
        await assertTimeSlotForRestaurant(restaurantId, payload.timeSlotId);
    }

    const food = await Menu.create({
        foodId: uuidv4(),
        restaurantId,
        ...payload,
    });

    const slotMap = await fetchTimeSlotMap(restaurantId, [food.timeSlotId]);
    return sanitizeMenuItem(food, slotMap);
};

export const getMenuItems = async (restaurantId, query) => {
    const filter = buildListFilter(restaurantId, query);
    const skip = (query.page - 1) * query.limit;
    const sort = { [query.sortBy]: query.sortOrder };

    const [foods, total] = await Promise.all([
        Menu.find(filter).sort(sort).skip(skip).limit(query.limit),
        Menu.countDocuments(filter),
    ]);

    const slotMap = await fetchTimeSlotMap(
        restaurantId,
        foods.map((f) => f.timeSlotId),
    );

    return {
        data: foods.map((food) => sanitizeMenuItem(food, slotMap)),
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit) || 1,
        },
    };
};

export const getMenuStats = async (restaurantId) => {
    const [totalFoods, activeFoods, inactiveFoods, timeSlotFoods, allDayFoods] =
        await Promise.all([
            Menu.countDocuments({ restaurantId }),
            Menu.countDocuments({ restaurantId, isActive: true }),
            Menu.countDocuments({ restaurantId, isActive: false }),
            Menu.countDocuments({ restaurantId, isTimeSlotBased: true }),
            Menu.countDocuments({ restaurantId, isTimeSlotBased: false }),
        ]);

    return {
        totalFoods,
        activeFoods,
        inactiveFoods,
        timeSlotFoods,
        allDayFoods,
    };
};

export const getMenuItemById = async (restaurantId, foodId) => {
    const food = await Menu.findOne({ restaurantId, foodId });

    if (!food) {
        throw new AppError("Menu item not found", 404);
    }

    const slotMap = await fetchTimeSlotMap(restaurantId, [food.timeSlotId]);
    return sanitizeMenuItem(food, slotMap);
};

export const updateMenuItem = async (restaurantId, foodId, payload) => {
    if (payload.isTimeSlotBased && payload.timeSlotId) {
        await assertTimeSlotForRestaurant(restaurantId, payload.timeSlotId);
    }

    if (payload.isTimeSlotBased === false) {
        payload.timeSlotId = null;
    }

    const food = await Menu.findOneAndUpdate(
        { restaurantId, foodId },
        { $set: payload },
        { new: true, runValidators: true },
    );

    if (!food) {
        throw new AppError("Menu item not found", 404);
    }

    const slotMap = await fetchTimeSlotMap(restaurantId, [food.timeSlotId]);
    return sanitizeMenuItem(food, slotMap);
};

export const deleteMenuItem = async (restaurantId, foodId) => {
    const food = await Menu.findOneAndDelete({ restaurantId, foodId });

    if (!food) {
        throw new AppError("Menu item not found", 404);
    }

    return { message: "Menu item deleted successfully" };
};

export const toggleMenuItemStatus = async (restaurantId, foodId, isActive) => {
    const food = await Menu.findOneAndUpdate(
        { restaurantId, foodId },
        { $set: { isActive } },
        { new: true },
    );

    if (!food) {
        throw new AppError("Menu item not found", 404);
    }

    const slotMap = await fetchTimeSlotMap(restaurantId, [food.timeSlotId]);
    return sanitizeMenuItem(food, slotMap);
};

export const getCustomerVisibleMenu = async (restaurantId) => {
    const currentMinutes = getCurrentMinutes();

    const [foods, activeSlots] = await Promise.all([
        Menu.find({ restaurantId, isActive: true }),
        TimeSlot.find({ restaurantId, isActive: true }),
    ]);

    const slotMap = new Map(activeSlots.map((slot) => [slot.slotId, slot]));

    const visible = foods.filter((food) => {
        if (!food.isTimeSlotBased) {
            return true;
        }

        const slot = slotMap.get(food.timeSlotId);
        if (!slot) {
            return false;
        }

        return isWithinTimeSlot(slot, currentMinutes);
    });

    return visible.map((food) => sanitizeMenuItem(food, slotMap));
};
