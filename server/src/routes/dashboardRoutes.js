import express from "express";
import { getAnalytics } from "../controller/dashboardController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.use(authenticate);
router.get("/analytics", asyncHandler(getAnalytics));

export default router;
