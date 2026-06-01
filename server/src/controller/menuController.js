import * as menuService from "../services/menuService.js";
import {
    validateCreateMenuBody,
    validateListMenuQuery,
    validateToggleMenuStatusBody,
    validateUpdateMenuBody,
} from "../validations/menuValidation.js";

export const createMenuItem = async (req, res) => {
    const payload = validateCreateMenuBody(req.body);
    const food = await menuService.createMenuItem(req.restaurantId, payload);

    res.status(201).json({
        message: "Menu item created successfully",
        food,
    });
};

export const getMenuItems = async (req, res) => {
    const query = validateListMenuQuery(req.query);
    const result = await menuService.getMenuItems(req.restaurantId, query);

    res.status(200).json(result);
};

export const getMenuStats = async (req, res) => {
    const stats = await menuService.getMenuStats(req.restaurantId);
    res.status(200).json({ stats });
};

export const getMenuItem = async (req, res) => {
    const food = await menuService.getMenuItemById(req.restaurantId, req.params.foodId);
    res.status(200).json({ food });
};

export const updateMenuItem = async (req, res) => {
    const payload = validateUpdateMenuBody(req.body);
    const food = await menuService.updateMenuItem(
        req.restaurantId,
        req.params.foodId,
        payload,
    );

    res.status(200).json({
        message: "Menu item updated successfully",
        food,
    });
};

export const deleteMenuItem = async (req, res) => {
    const result = await menuService.deleteMenuItem(req.restaurantId, req.params.foodId);
    res.status(200).json(result);
};

export const toggleMenuItemStatus = async (req, res) => {
    const { isActive } = validateToggleMenuStatusBody(req.body);
    const food = await menuService.toggleMenuItemStatus(
        req.restaurantId,
        req.params.foodId,
        isActive,
    );

    res.status(200).json({
        message: `Menu item ${isActive ? "enabled" : "disabled"} successfully`,
        food,
    });
};

export const getPublicMenu = async (req, res) => {
    const { restaurantId } = req.params;
    const foods = await menuService.getCustomerVisibleMenu(restaurantId);

    res.status(200).json({
        restaurantId,
        data: foods,
        count: foods.length,
    });
};
