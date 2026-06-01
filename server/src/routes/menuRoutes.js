import express from "express";
import {
    createMenuItem,
    deleteMenuItem,
    getMenuItem,
    getMenuItems,
    getMenuStats,
    getPublicMenu,
    toggleMenuItemStatus,
    updateMenuItem,
} from "../controller/menuController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.get("/public/:restaurantId", asyncHandler(getPublicMenu));

router.use(authenticate);

router.post("/", asyncHandler(createMenuItem));
router.get("/stats", asyncHandler(getMenuStats));
router.get("/", asyncHandler(getMenuItems));
router.get("/:foodId", asyncHandler(getMenuItem));
router.put("/:foodId", asyncHandler(updateMenuItem));
router.delete("/:foodId", asyncHandler(deleteMenuItem));
router.patch("/:foodId/status", asyncHandler(toggleMenuItemStatus));

export default router;
