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

const hourLabel = (h) => {
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour} ${period}`;
};

const getTimeSlot = (hour) => {
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
};

const TIME_SLOT_LABELS = {
    morning: "Morning (6 AM – 11 AM)",
    afternoon: "Afternoon (12 PM – 4 PM)",
    evening: "Evening (5 PM – 8 PM)",
    night: "Night (9 PM – 5 AM)",
};

export const resolveRevenueRange = ({ range = "30d", startDate, endDate, customDate } = {}) => {
    const now = new Date();
    let start;
    let end = endOfDay(now);

    if (startDate && endDate) {
        start = startOfDay(new Date(startDate));
        end = endOfDay(new Date(endDate));
        return { start, end, range: "custom" };
    }

    switch (range) {
        case "today":
            start = startOfDay(now);
            break;
        case "7d":
            start = startOfDay(now);
            start.setDate(start.getDate() - 6);
            break;
        case "90d":
            start = startOfDay(now);
            start.setDate(start.getDate() - 89);
            break;
        case "custom":
            if (!customDate) throw new Error("customDate required");
            start = startOfDay(new Date(customDate));
            end = endOfDay(new Date(customDate));
            break;
        case "30d":
        default:
            start = startOfDay(now);
            start.setDate(start.getDate() - 29);
    }

    return { start, end, range };
};

const revenueMatch = (restaurantId, start, end, completedOnly = true) => {
    const match = {
        restaurantId,
        createdAt: { $gte: start, $lte: end },
    };
    if (completedOnly) {
        match.orderStatus = "completed";
    }
    return match;
};

const sumRevenue = async (filter) => {
    const agg = await Order.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);
    return {
        revenue: agg[0]?.total || 0,
        orders: agg[0]?.count || 0,
    };
};

const buildDailySeries = async (restaurantId, start, end) => {
    const agg = await Order.aggregate([
        { $match: revenueMatch(restaurantId, start, end) },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                revenue: { $sum: "$total" },
                orders: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const map = new Map(agg.map((r) => [r._id, r]));
    const series = [];
    const cursor = startOfDay(start);
    const endDay = startOfDay(end);

    while (cursor <= endDay) {
        const key = cursor.toISOString().slice(0, 10);
        const row = map.get(key);
        series.push({
            date: key,
            label: cursor.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
            revenue: row?.revenue || 0,
            orders: row?.orders || 0,
        });
        cursor.setDate(cursor.getDate() + 1);
    }

    return series;
};

const buildWeeklySeries = async (restaurantId, start, end) => {
    const agg = await Order.aggregate([
        { $match: revenueMatch(restaurantId, start, end) },
        {
            $group: {
                _id: { $isoWeek: "$createdAt" },
                year: { $first: { $isoWeekYear: "$createdAt" } },
                revenue: { $sum: "$total" },
                orders: { $sum: 1 },
                weekStart: { $min: "$createdAt" },
            },
        },
        { $sort: { weekStart: 1 } },
    ]);

    return agg.map((row, i, arr) => {
        const prev = arr[i - 1];
        const growth =
            prev && prev.revenue > 0
                ? Math.round(((row.revenue - prev.revenue) / prev.revenue) * 100)
                : null;
        return {
            week: row._id,
            label: `Week ${row._id}`,
            revenue: row.revenue,
            orders: row.orders,
            orderGrowth: growth,
        };
    });
};

const buildMonthlySeries = async (restaurantId, start, end) => {
    const agg = await Order.aggregate([
        { $match: revenueMatch(restaurantId, start, end) },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                revenue: { $sum: "$total" },
                orders: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    return agg.map((row, i, arr) => {
        const prev = arr[i - 1];
        const growth =
            prev && prev.revenue > 0
                ? Math.round(((row.revenue - prev.revenue) / prev.revenue) * 100)
                : null;
        return {
            month: row._id,
            label: new Date(`${row._id}-01`).toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric",
            }),
            revenue: row.revenue,
            orders: row.orders,
            growthPercent: growth,
        };
    });
};

const buildTimeBased = async (restaurantId, start, end) => {
    const agg = await Order.aggregate([
        { $match: revenueMatch(restaurantId, start, end) },
        {
            $group: {
                _id: { $hour: "$createdAt" },
                revenue: { $sum: "$total" },
                orders: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const byHour = Array.from({ length: 24 }, (_, hour) => {
        const row = agg.find((r) => r._id === hour);
        return {
            hour,
            label: hourLabel(hour),
            revenue: row?.revenue || 0,
            orders: row?.orders || 0,
        };
    });

    const slotMap = {
        morning: { revenue: 0, orders: 0 },
        afternoon: { revenue: 0, orders: 0 },
        evening: { revenue: 0, orders: 0 },
        night: { revenue: 0, orders: 0 },
    };

    byHour.forEach((row) => {
        const slot = getTimeSlot(row.hour);
        slotMap[slot].revenue += row.revenue;
        slotMap[slot].orders += row.orders;
    });

    const byTimeSlot = Object.entries(slotMap).map(([key, val]) => ({
        slot: key,
        label: TIME_SLOT_LABELS[key],
        revenue: val.revenue,
        orders: val.orders,
    }));

    const peakHour = [...byHour].sort((a, b) => b.revenue - a.revenue)[0];
    const peakSlot = [...byTimeSlot].sort((a, b) => b.revenue - a.revenue)[0];

    return {
        byHour,
        byTimeSlot,
        peakOrderingHour: peakHour?.revenue ? peakHour.label : "—",
        peakRevenueTimeSlot: peakSlot?.revenue ? peakSlot.label : "—",
    };
};

const buildTableRevenue = async (restaurantId, start, end) => {
    const agg = await Order.aggregate([
        { $match: revenueMatch(restaurantId, start, end) },
        {
            $group: {
                _id: "$tableId",
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: "$total" },
                lastOrderAt: { $max: "$createdAt" },
            },
        },
        { $sort: { totalRevenue: -1 } },
    ]);

    const tableIds = agg.map((r) => r._id);
    const tables = await Table.find({ tableId: { $in: tableIds } });
    const tableMap = new Map(tables.map((t) => [t.tableId, t]));

    const rows = agg.map((row) => {
        const table = tableMap.get(row._id);
        const avgBill =
            row.totalOrders > 0 ? Math.round(row.totalRevenue / row.totalOrders) : 0;
        return {
            tableId: row._id,
            tableNumber: table?.tableNumber ?? "—",
            tableName: table?.tableName ?? "—",
            totalOrders: row.totalOrders,
            totalRevenue: row.totalRevenue,
            averageBillValue: avgBill,
            lastOrderTime: row.lastOrderAt,
        };
    });

    return {
        tables: rows,
        topPerforming: rows.slice(0, 5),
        mostFrequent: [...rows].sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 5),
        highestSpending: rows.slice(0, 5),
    };
};

const computeAvgPrepMinutes = async (restaurantId, start, end) => {
    const orders = await Order.find({
        restaurantId,
        createdAt: { $gte: start, $lte: end },
        orderStatus: "completed",
    })
        .select("statusHistory createdAt")
        .lean();

    const durations = [];
    orders.forEach((order) => {
        const history = order.statusHistory || [];
        const prepStart = history.find((h) =>
            ["confirmed", "placed"].includes(h.status),
        )?.at;
        const prepEnd = history.find((h) => h.status === "preparing")?.at;
        if (prepStart && prepEnd) {
            durations.push((new Date(prepEnd) - new Date(prepStart)) / 60000);
        }
    });

    if (!durations.length) return 0;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
};

const buildCancellationAnalytics = async (restaurantId, start, end) => {
    const cancelFilter = {
        restaurantId,
        createdAt: { $gte: start, $lte: end },
        orderStatus: "cancelled",
    };

    const [breakdown, recentCancellations] = await Promise.all([
        Order.aggregate([
            { $match: cancelFilter },
            {
                $group: {
                    _id: "$cancellationReason",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]),
        Order.find(cancelFilter)
            .sort({ cancelledAt: -1 })
            .limit(10)
            .select(
                "orderId orderNumber cancellationReason customReason cancelledBy cancelledAt previousOrderStatus total",
            )
            .lean(),
    ]);

    return {
        breakdown: breakdown.map((row) => ({
            reason: row._id || "Unknown",
            count: row.count,
        })),
        recent: recentCancellations.map((o) => ({
            orderId: o.orderId,
            orderNumber: o.orderNumber,
            cancellationReason: o.cancellationReason,
            customReason: o.customReason,
            cancelledBy: o.cancelledBy,
            cancelledAt: o.cancelledAt,
            previousOrderStatus: o.previousOrderStatus,
            total: o.total,
        })),
    };
};

export const getRevenueAnalytics = async (restaurantId, options = {}) => {
    const { start, end, range } = resolveRevenueRange(options);
    const now = new Date();

    const todayStart = startOfDay(now);
    const weekStart = startOfDay(now);
    weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = startOfDay(now);
    monthStart.setDate(monthStart.getDate() - 29);

    const [
        todayStats,
        weekStats,
        monthStats,
        allTimeStats,
        periodStats,
        completedInPeriod,
        cancelledInPeriod,
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenue,
        timeBased,
        tableAnalytics,
        avgPrepMinutes,
        cancellationAnalytics,
    ] = await Promise.all([
        sumRevenue(revenueMatch(restaurantId, todayStart, endOfDay(now))),
        sumRevenue(revenueMatch(restaurantId, weekStart, endOfDay(now))),
        sumRevenue(revenueMatch(restaurantId, monthStart, endOfDay(now))),
        sumRevenue({ restaurantId, orderStatus: "completed" }),
        sumRevenue(revenueMatch(restaurantId, start, end)),
        Order.countDocuments(revenueMatch(restaurantId, start, end)),
        Order.countDocuments({
            restaurantId,
            createdAt: { $gte: start, $lte: end },
            orderStatus: "cancelled",
        }),
        buildDailySeries(restaurantId, start, end),
        buildWeeklySeries(restaurantId, start, end),
        buildMonthlySeries(restaurantId, start, end),
        buildTimeBased(restaurantId, start, end),
        buildTableRevenue(restaurantId, start, end),
        computeAvgPrepMinutes(restaurantId, start, end),
        buildCancellationAnalytics(restaurantId, start, end),
    ]);

    const totalOrdersInPeriod = completedInPeriod + cancelledInPeriod;
    const cancellationRate =
        totalOrdersInPeriod > 0
            ? Math.round((cancelledInPeriod / totalOrdersInPeriod) * 1000) / 10
            : 0;

    const averageOrderValue =
        periodStats.orders > 0 ? Math.round(periodStats.revenue / periodStats.orders) : 0;

    return {
        range,
        period: { start, end },
        overview: {
            todayRevenue: todayStats.revenue,
            weekRevenue: weekStats.revenue,
            monthRevenue: monthStats.revenue,
            totalRevenue: allTimeStats.revenue,
            totalOrders: allTimeStats.orders,
            averageOrderValue:
                allTimeStats.orders > 0
                    ? Math.round(allTimeStats.revenue / allTimeStats.orders)
                    : 0,
            periodRevenue: periodStats.revenue,
            periodOrders: periodStats.orders,
            periodAverageOrderValue: averageOrderValue,
        },
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenue,
        timeBased,
        tableAnalytics,
        orderAnalytics: {
            completedOrders: completedInPeriod,
            cancelledOrders: cancelledInPeriod,
            cancellationRate,
            averagePreparationMinutes: avgPrepMinutes,
            averageOrderValue,
        },
        cancellationAnalytics,
    };
};

export const buildRevenueCsv = (analytics) => {
    const lines = [
        "Foodify Revenue Export",
        `Period,${analytics.period.start.toISOString()},${analytics.period.end.toISOString()}`,
        "",
        "Overview",
        `Today's Revenue,${analytics.overview.todayRevenue}`,
        `Week Revenue,${analytics.overview.weekRevenue}`,
        `Month Revenue,${analytics.overview.monthRevenue}`,
        `Total Revenue,${analytics.overview.totalRevenue}`,
        `Total Orders,${analytics.overview.totalOrders}`,
        `Average Order Value,${analytics.overview.averageOrderValue}`,
        "",
        "Daily Revenue",
        "Date,Revenue,Orders",
        ...analytics.dailyRevenue.map((d) => `${d.date},${d.revenue},${d.orders}`),
        "",
        "Table Performance",
        "Table Number,Table Name,Orders,Revenue,Avg Bill,Last Order",
        ...analytics.tableAnalytics.tables.map(
            (t) =>
                `${t.tableNumber},${t.tableName},${t.totalOrders},${t.totalRevenue},${t.averageBillValue},${t.lastOrderTime}`,
        ),
    ];
    return lines.join("\n");
};
