import express from "express";
import {
    createTimeSlot,
    deleteTimeSlot,
    getTimeSlot,
    getTimeSlots,
    toggleTimeSlotStatus,
    updateTimeSlot,
} from "../controller/timeSlotController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.use(authenticate);

router.post("/", asyncHandler(createTimeSlot));
router.get("/", asyncHandler(getTimeSlots));
router.get("/:slotId", asyncHandler(getTimeSlot));
router.put("/:slotId", asyncHandler(updateTimeSlot));
router.delete("/:slotId", asyncHandler(deleteTimeSlot));
router.patch("/:slotId/status", asyncHandler(toggleTimeSlotStatus));

export default router;
