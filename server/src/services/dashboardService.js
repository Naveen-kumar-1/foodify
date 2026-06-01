import Order from "../model/Order.js";
import Table from "../model/Table.js";

const startOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const endOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

export const resolveDateRange = (range, customDate) => {
    const now = new Date();
    let start;
    let end;

    switch (range) {
        case "yesterday": {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            start = startOfDay(y);
            end = endOfDay(y);
            break;
        }
        case "7d":
            start = startOfDay(now);
            start.setDate(start.getDate() - 6);
            end = endOfDay(now);
            break;
        case "30d":
            start = startOfDay(now);
            start.setDate(start.getDate() - 29);
            end = endOfDay(now);
            break;
        case "custom":
            if (!customDate) throw new Error("customDate required");
            start = startOfDay(new Date(customDate));
            end = endOfDay(new Date(customDate));
            break;
        case "today":
        default:
            start = startOfDay(now);
            end = endOfDay(now);
    }

    return { start, end };
};

const hourLabel = (h) => {
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour} ${period}`;
};

export const getDashboardAnalytics = async (restaurantId, { range = "today", customDate } = {}) => {
    const { start, end } = resolveDateRange(range, customDate);

    const periodFilter = { restaurantId, createdAt: { $gte: start, $lte: end } };

    const [
        periodOrders,
        completedInPeriod,
        cancelledInPeriod,
        pendingOrders,
        activeTableIds,
        recentOrdersRaw,
        completedRevenueAgg,
        hourAgg,
    ] = await Promise.all([
        Order.countDocuments(periodFilter),
        Order.countDocuments({ ...periodFilter, orderStatus: "completed" }),
        Order.countDocuments({ ...periodFilter, orderStatus: "cancelled" }),
        Order.countDocuments({
            restaurantId,
            orderStatus: { $in: ["placed", "confirmed", "preparing", "ready"] },
        }),
        Order.distinct("tableId", {
            restaurantId,
            orderStatus: { $in: ["placed", "confirmed", "preparing", "ready", "served"] },
        }),
        Order.find(periodFilter).sort({ createdAt: -1 }).limit(10).lean(),
        Order.aggregate([
            { $match: { ...periodFilter, orderStatus: "completed" } },
            { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Order.aggregate([
            { $match: periodFilter },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 1 },
        ]),
    ]);

    const totalRevenue = completedRevenueAgg[0]?.total || 0;
    const averageOrderValue =
        completedInPeriod > 0 ? Math.round(totalRevenue / completedInPeriod) : 0;
    const peakHour = hourAgg[0]?._id;
    const peakOrderingTime = peakHour != null ? hourLabel(peakHour) : "—";

    const tableIds = [...new Set(recentOrdersRaw.map((o) => o.tableId))];
    const tables = await Table.find({ tableId: { $in: tableIds } });
    const tableMap = new Map(tables.map((t) => [t.tableId, t]));

    const recentOrders = recentOrdersRaw.map((o) => ({
        orderId: o.orderId,
        orderNumber: o.orderNumber,
        tableNumber: tableMap.get(o.tableId)?.tableNumber ?? "—",
        total: o.total,
        orderStatus: o.orderStatus,
        createdAt: o.createdAt,
    }));

    const statusBreakdown = await Order.aggregate([
        { $match: periodFilter },
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]);

    const chart = await buildSalesChart(restaurantId, range, start, end);

    return {
        range,
        period: { start, end },
        summary: {
            todayOrders: periodOrders,
            todayRevenue: totalRevenue,
            pendingOrders,
            completedOrders: completedInPeriod,
            cancelledOrders: cancelledInPeriod,
            activeTables: activeTableIds.length,
        },
        dailySales: {
            totalOrders: periodOrders,
            totalRevenue,
            averageOrderValue,
            peakOrderingTime,
        },
        statusBreakdown: statusBreakdown.map((s) => ({
            status: s._id,
            count: s.count,
        })),
        recentOrders,
        salesChart: chart,
    };
};

async function buildSalesChart(restaurantId, range, start, end) {
    if (range === "7d" || range === "30d") {
        const days = range === "7d" ? 7 : 30;
        const buckets = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            buckets.push({
                date: startOfDay(d),
                label: d.toLocaleDateString("en-IN", { weekday: "short" }),
            });
        }

        const agg = await Order.aggregate([
            {
                $match: {
                    restaurantId,
                    createdAt: { $gte: start, $lte: end },
                    orderStatus: { $ne: "cancelled" },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    revenue: { $sum: "$total" },
                    orders: { $sum: 1 },
                },
            },
        ]);

        const map = new Map(agg.map((r) => [r._id, r]));
        return buckets.map((b) => {
            const key = b.date.toISOString().slice(0, 10);
            const row = map.get(key);
            return {
                label: b.label,
                revenue: row?.revenue || 0,
                orders: row?.orders || 0,
            };
        });
    }

    const agg = await Order.aggregate([
        {
            $match: {
                restaurantId,
                createdAt: { $gte: start, $lte: end },
                orderStatus: { $ne: "cancelled" },
            },
        },
        {
            $group: {
                _id: { $hour: "$createdAt" },
                revenue: { $sum: "$total" },
                orders: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const map = new Map(agg.map((r) => [r._id, r]));
    return Array.from({ length: 24 }, (_, hour) => ({
        label: hourLabel(hour),
        revenue: map.get(hour)?.revenue || 0,
        orders: map.get(hour)?.orders || 0,
    })).filter((_, i) => i >= 6 && i <= 23);
}
