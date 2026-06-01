import * as revenueService from "../services/revenueService.js";
import { AppError } from "../middleware/errorHandler.js";

export const getRevenueAnalytics = async (req, res) => {
    const { range, startDate, endDate, date } = req.query;

    try {
        const analytics = await revenueService.getRevenueAnalytics(req.restaurantId, {
            range: range || "30d",
            startDate,
            endDate,
            customDate: date,
        });
        res.status(200).json(analytics);
    } catch (err) {
        throw new AppError(err.message || "Invalid date range", 400);
    }
};

export const exportRevenueCsv = async (req, res) => {
    const { range, startDate, endDate, date } = req.query;

    const analytics = await revenueService.getRevenueAnalytics(req.restaurantId, {
        range: range || "30d",
        startDate,
        endDate,
        customDate: date,
    });

    const csv = revenueService.buildRevenueCsv(analytics);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
        "Content-Disposition",
        'attachment; filename="foodify-revenue-export.csv"',
    );
    res.status(200).send(csv);
};
