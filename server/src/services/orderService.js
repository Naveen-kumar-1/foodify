import { v4 as uuidv4 } from "uuid";
import Order from "../model/Order.js";
import Restaurant from "../model/Restaurant.js";
import { AppError } from "../middleware/errorHandler.js";
import { getCustomerVisibleMenu } from "./menuService.js";
import { getTableByQrToken } from "./tableService.js";
import { validateCoupon } from "./couponService.js";
import { validateStatusUpdate } from "../validations/orderValidation.js";
import {
    buildOrderLinesFromMenu,
    calculateOrderTotals,
} from "../utils/orderTotals.js";
import { emitOrderPlaced, emitOrderStatusUpdated } from "../socket/emitters.js";

const sanitizeOrder = (order, table = null) => ({
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    restaurantId: order.restaurantId,
    tableId: order.tableId,
    table: table
        ? { tableId: table.tableId, tableName: table.tableName, tableNumber: table.tableNumber }
        : null,
    customerSessionId: order.customerSessionId,
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount,
    tax: order.tax,
    total: order.total,
    couponCode: order.couponCode,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    notes: order.notes,
    statusHistory: order.statusHistory,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
});

const generateOrderNumber = async (restaurantId) => {
    const count = await Order.countDocuments({ restaurantId });
    return `ORD-${1001 + count}`;
};

export const groupMenuByCategory = (foods) => {
    const groups = new Map();
    const allDayLabel = "Available All Day";

    foods.forEach((food) => {
        const key = food.isTimeSlotBased && food.timeSlot ? food.timeSlot.slotName : allDayLabel;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(food);
    });

    return Array.from(groups.entries()).map(([category, items]) => ({
        category,
        items,
    }));
};

export const scanQrAndGetMenu = async (qrToken) => {
    const table = await getTableByQrToken(qrToken);
    const restaurant = await Restaurant.findOne({ restaurantId: table.restaurantId });

    if (!restaurant) throw new AppError("Restaurant not found", 404);

    const foods = await getCustomerVisibleMenu(table.restaurantId);
    const categories = groupMenuByCategory(foods);

    return {
        restaurant: {
            restaurantId: restaurant.restaurantId,
            name: restaurant.name,
            logo: restaurant.logo,
            logoUrl: restaurant.logo,
            slogan: restaurant.slogan,
            description: restaurant.description || "",
            phone: restaurant.phone || "",
            email: restaurant.email || "",
            address: restaurant.address || restaurant.location || "",
            city: restaurant.city || "",
            state: restaurant.state || "",
            postalCode: restaurant.postalCode || "",
            timings: restaurant.timings || "",
            gstNumber: restaurant.gstNumber || "",
            fssaiNumber: restaurant.fssaiNumber || "",
        },
        table: {
            tableId: table.tableId,
            tableName: table.tableName,
            tableNumber: table.tableNumber,
        },
        categories,
        menu: foods,
    };
};

const resolveOrderPricing = async (restaurantId, payload) => {
    const visibleMenu = await getCustomerVisibleMenu(restaurantId);
    const menuMap = new Map(visibleMenu.map((f) => [f.foodId, f]));
    const lines = buildOrderLinesFromMenu(payload.items, menuMap);

    let discount = 0;
    const grossSubtotal = lines.reduce((sum, line) => sum + line.lineSubtotal, 0);
    if (payload.couponCode) {
        const couponResult = await validateCoupon(restaurantId, payload.couponCode, grossSubtotal);
        discount = couponResult.discount;
    }

    return calculateOrderTotals(lines, discount);
};

export const previewOrder = async (qrToken, payload) => {
    const table = await getTableByQrToken(qrToken);
    const totals = await resolveOrderPricing(table.restaurantId, payload);
    return totals;
};

export const placeOrder = async (qrToken, payload) => {
    const table = await getTableByQrToken(qrToken);
    const { items: orderItems, subtotal, discount, tax, total } = await resolveOrderPricing(
        table.restaurantId,
        payload,
    );

    const order = await Order.create({
        orderId: uuidv4(),
        orderNumber: await generateOrderNumber(table.restaurantId),
        restaurantId: table.restaurantId,
        tableId: table.tableId,
        customerSessionId: payload.customerSessionId,
        items: orderItems,
        subtotal,
        discount,
        tax,
        total,
        couponCode: payload.couponCode,
        paymentMethod: payload.paymentMethod,
        paymentStatus: "not_required",
        orderStatus: "placed",
        notes: payload.notes,
        statusHistory: [{ status: "placed", at: new Date() }],
    });

    const sanitized = sanitizeOrder(order, table);
    emitOrderPlaced(sanitized);
    return sanitized;
};

export const getOrderForTracking = async (orderId, customerSessionId) => {
    const order = await Order.findOne({ orderId, customerSessionId });
    if (!order) throw new AppError("Order not found", 404);
    const Table = (await import("../model/Table.js")).default;
    const table = await Table.findOne({ tableId: order.tableId });
    return sanitizeOrder(order, table);
};

export const getOrders = async (restaurantId, query) => {
    const filter = { restaurantId };

    if (query.status !== "all") filter.orderStatus = query.status;
    if (query.search) {
        filter.$or = [
            { orderNumber: { $regex: query.search, $options: "i" } },
            { "items.foodName": { $regex: query.search, $options: "i" } },
        ];
    }
    if (query.todayOnly) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        filter.createdAt = { $gte: start };
    }

    const skip = (query.page - 1) * query.limit;
    const [orders, total] = await Promise.all([
        Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
        Order.countDocuments(filter),
    ]);

    const Table = (await import("../model/Table.js")).default;
    const tableIds = [...new Set(orders.map((o) => o.tableId))];
    const tables = await Table.find({ tableId: { $in: tableIds } });
    const tableMap = new Map(tables.map((t) => [t.tableId, t]));

    return {
        data: orders.map((o) => sanitizeOrder(o, tableMap.get(o.tableId))),
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit) || 1,
        },
    };
};

export const getOrderStats = async (restaurantId) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const baseFilter = { restaurantId, createdAt: { $gte: start } };

    const [todayOrders, todayRevenueAgg, pendingOrders, completedOrders, cancelledOrders] =
        await Promise.all([
            Order.countDocuments(baseFilter),
            Order.aggregate([
                { $match: { ...baseFilter, orderStatus: { $ne: "cancelled" } } },
                { $group: { _id: null, total: { $sum: "$total" } } },
            ]),
            Order.countDocuments({
                restaurantId,
                orderStatus: { $in: ["placed", "preparing", "ready", "served"] },
            }),
            Order.countDocuments({ ...baseFilter, orderStatus: "completed" }),
            Order.countDocuments({ ...baseFilter, orderStatus: "cancelled" }),
        ]);

    return {
        todayOrders,
        todayRevenue: todayRevenueAgg[0]?.total || 0,
        pendingOrders,
        completedOrders,
        cancelledOrders,
    };
};

export const getKitchenOrders = async (restaurantId, query) => {
    const filter = { restaurantId };

    if (query.status === "active") {
        filter.orderStatus = { $in: ["placed", "preparing", "ready", "served"] };
    } else if (query.status !== "all") {
        filter.orderStatus = query.status;
    }

    const Table = (await import("../model/Table.js")).default;

    if (query.search) {
        const searchRegex = { $regex: query.search, $options: "i" };
        const matchingTables = await Table.find({
            restaurantId,
            $or: [{ tableNumber: searchRegex }, { tableName: searchRegex }],
        });
        const tableIds = matchingTables.map((t) => t.tableId);
        filter.$or = [{ orderNumber: searchRegex }, { tableId: { $in: tableIds } }];
    }

    const sortOrder = query.sort === "oldest" ? 1 : -1;
    const skip = (query.page - 1) * query.limit;

    const [orders, total] = await Promise.all([
        Order.find(filter).sort({ createdAt: sortOrder }).skip(skip).limit(query.limit),
        Order.countDocuments(filter),
    ]);

    const tableIds = [...new Set(orders.map((o) => o.tableId))];
    const tables = await Table.find({ tableId: { $in: tableIds } });
    const tableMap = new Map(tables.map((t) => [t.tableId, t]));

    return {
        data: orders.map((o) => sanitizeOrder(o, tableMap.get(o.tableId))),
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit) || 1,
        },
    };
};

export const updateOrderStatus = async (restaurantId, orderId, nextStatus) => {
    const order = await Order.findOne({ restaurantId, orderId });
    if (!order) throw new AppError("Order not found", 404);

    validateStatusUpdate(order.orderStatus, nextStatus);

    order.orderStatus = nextStatus;
    order.statusHistory.push({ status: nextStatus, at: new Date() });
    await order.save();

    const Table = (await import("../model/Table.js")).default;
    const table = await Table.findOne({ tableId: order.tableId });

    const sanitized = sanitizeOrder(order, table);
    emitOrderStatusUpdated(sanitized);
    return sanitized;
};

export const getOrderById = async (restaurantId, orderId) => {
    const order = await Order.findOne({ restaurantId, orderId });
    if (!order) throw new AppError("Order not found", 404);
    const Table = (await import("../model/Table.js")).default;
    const table = await Table.findOne({ tableId: order.tableId });
    return sanitizeOrder(order, table);
};
