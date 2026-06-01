import jwt from "jsonwebtoken";
import Restaurant from "../model/Restaurant.js";

export const verifyRestaurantToken = async (token) => {
    if (!token) throw new Error("Authentication required");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "access") throw new Error("Invalid token");

    const restaurant = await Restaurant.findOne({ restaurantId: decoded.restaurantId });
    if (!restaurant) throw new Error("Restaurant not found");

    return decoded.restaurantId;
};
