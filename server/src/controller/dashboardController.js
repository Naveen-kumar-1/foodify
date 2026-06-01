import * as dashboardService from "../services/dashboardService.js";
import { AppError } from "../middleware/errorHandler.js";

export const getAnalytics = async (req, res) => {
    const range = req.query.range || "today";
    const customDate = req.query.date;

    if (!["today", "yesterday", "7d", "30d", "custom"].includes(range)) {
        throw new AppError("Invalid range", 400);
    }

    if (range === "custom" && !customDate) {
        throw new AppError("Date is required for custom range", 400);
    }

    const analytics = await dashboardService.getDashboardAnalytics(req.restaurantId, {
        range,
        customDate,
    });

    res.status(200).json(analytics);
};
