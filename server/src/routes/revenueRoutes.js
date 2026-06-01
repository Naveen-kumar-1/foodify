import express from "express";
import { exportRevenueCsv, getRevenueAnalytics } from "../controller/revenueController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.use(authenticate);

router.get("/analytics", asyncHandler(getRevenueAnalytics));
router.get("/export", asyncHandler(exportRevenueCsv));

export default router;
