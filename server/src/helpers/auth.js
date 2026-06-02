import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const ACCESS_TOKEN_EXPIRY = "15m";
// Keep sessions persistent across revisits. Access tokens stay short-lived (15m),
// refresh tokens are long-lived and rotated via /auth/refresh-token.
const REFRESH_TOKEN_EXPIRY = "365d";

export const generateVerificationToken = () => uuidv4();

export const generateAuthTokens = (restaurantId) => {
    const accessToken = jwt.sign(
        { restaurantId, type: "access" },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
        { restaurantId, type: "refresh" },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
};

export const sanitizeRestaurant = (restaurant) => {
    const sanitized = restaurant.toObject ? restaurant.toObject() : { ...restaurant };
    delete sanitized.password;
    return sanitized;
};

export const formatRestaurantProfile = (restaurant) => {
    const data = sanitizeRestaurant(restaurant);

    return {
        restaurantId: data.restaurantId,
        name: data.name,
        email: data.email,
        location: data.location,
        address: data.address || data.location || "",
        city: data.city || "",
        state: data.state || "",
        postalCode: data.postalCode || "",
        gstNumber: data.gstNumber || "",
        fssaiNumber: data.fssaiNumber || "",
        description: data.description,
        phone: data.phone,
        logo: data.logo,
        logoUrl: data.logo,
        logoPublicId: data.logoPublicId || "",
        timings: data.timings,
        slogan: data.slogan,
        isActive: data.isActive,
        isEmailVerified: data.isEmailVerified,
    };
};
