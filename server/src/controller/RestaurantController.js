import { AppError } from "../middleware/errorHandler.js";
import * as restaurantService from "../services/restaurantService.js";

export const getProfile = async (req, res) => {
    const profile = await restaurantService.getProfile(req.restaurant);
    res.status(200).json(profile);
};

export const updateProfile = async (req, res) => {
    const profile = await restaurantService.updateProfile(req.restaurant, req.body);
    res.status(200).json({
        message: "Profile updated successfully",
        restaurant: profile,
    });
};

export const uploadLogo = async (req, res) => {
    if (!req.file) {
        throw new AppError("Logo image is required", 400);
    }
    const profile = await restaurantService.uploadRestaurantLogo(req.restaurant, req.file.buffer);
    res.status(200).json({
        message: "Logo uploaded successfully",
        restaurant: profile,
    });
};

export const deleteLogo = async (req, res) => {
    const profile = await restaurantService.removeRestaurantLogo(req.restaurant);
    res.status(200).json({
        message: "Logo removed successfully",
        restaurant: profile,
    });
};
