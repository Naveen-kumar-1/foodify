import * as timeSlotService from "../services/timeSlotService.js";
import {
    validateCreateTimeSlotBody,
    validateListQuery,
    validateToggleStatusBody,
    validateUpdateTimeSlotBody,
} from "../validations/timeSlotValidation.js";

export const createTimeSlot = async (req, res) => {
    const payload = validateCreateTimeSlotBody(req.body);
    const slot = await timeSlotService.createTimeSlot(req.restaurantId, payload);

    res.status(201).json({
        message: "Time slot created successfully",
        timeSlot: slot,
    });
};

export const getTimeSlots = async (req, res) => {
    const query = validateListQuery(req.query);
    const result = await timeSlotService.getTimeSlots(req.restaurantId, query);

    res.status(200).json(result);
};

export const getTimeSlot = async (req, res) => {
    const slot = await timeSlotService.getTimeSlotById(req.restaurantId, req.params.slotId);

    res.status(200).json({ timeSlot: slot });
};

export const updateTimeSlot = async (req, res) => {
    const payload = validateUpdateTimeSlotBody(req.body);
    const slot = await timeSlotService.updateTimeSlot(
        req.restaurantId,
        req.params.slotId,
        payload,
    );

    res.status(200).json({
        message: "Time slot updated successfully",
        timeSlot: slot,
    });
};

export const deleteTimeSlot = async (req, res) => {
    const result = await timeSlotService.deleteTimeSlot(
        req.restaurantId,
        req.params.slotId,
    );

    res.status(200).json(result);
};

export const toggleTimeSlotStatus = async (req, res) => {
    const { isActive } = validateToggleStatusBody(req.body);
    const slot = await timeSlotService.toggleTimeSlotStatus(
        req.restaurantId,
        req.params.slotId,
        isActive,
    );

    res.status(200).json({
        message: `Time slot ${isActive ? "enabled" : "disabled"} successfully`,
        timeSlot: slot,
    });
};
