import jwt from "jsonwebtoken";
import Restaurant from "../model/Restaurant.js";
import { AppError } from "./errorHandler.js";

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            throw new AppError("Authentication required", 401);
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== "access") {
            throw new AppError("Invalid token", 401);
        }

        const restaurant = await Restaurant.findOne({ restaurantId: decoded.restaurantId });

        if (!restaurant) {
            throw new AppError("Invalid token", 401);
        }

        req.restaurant = restaurant;
        req.restaurantId = decoded.restaurantId;
        next();
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }

        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return next(new AppError("Invalid or expired token", 401));
        }

        next(error);
    }
};
