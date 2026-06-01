import express from "express";
import {
    getKitchenBoard,
    getOrder,
    getOrders,
    getOrderStats,
    kitchenUpdateStatus,
    placeOrder,
    previewOrder,
    scanMenu,
    trackOrder,
    updateOrderStatus,
    validateCouponCode,
} from "../controller/orderController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.get("/public/scan/:qrToken", asyncHandler(scanMenu));
router.post("/public/preview/:qrToken", asyncHandler(previewOrder));
router.post("/public/place/:qrToken", asyncHandler(placeOrder));
router.get("/public/track/:orderId", asyncHandler(trackOrder));
router.post("/public/coupon/:qrToken", asyncHandler(validateCouponCode));

router.use(authenticate);

router.get("/stats", asyncHandler(getOrderStats));
router.get("/kitchen/board", asyncHandler(getKitchenBoard));
router.patch("/kitchen/:orderId/status", asyncHandler(kitchenUpdateStatus));
router.get("/", asyncHandler(getOrders));
router.get("/:orderId", asyncHandler(getOrder));
router.patch("/:orderId/status", asyncHandler(updateOrderStatus));

export default router;
