import { AppError } from "../middleware/errorHandler.js";
import { formatRestaurantProfile } from "../helpers/auth.js";
import { isPhoneValid } from "../helpers/common.js";
import * as cloudinaryService from "./cloudinaryService.js";

const EDITABLE_FIELDS = [
    "name",
    "location",
    "address",
    "city",
    "state",
    "postalCode",
    "gstNumber",
    "fssaiNumber",
    "description",
    "phone",
    "logo",
    "timings",
    "slogan",
];
const PROTECTED_FIELDS = [
    "restaurantId",
    "email",
    "password",
    "logoPublicId",
    "isEmailVerified",
    "createdAt",
    "updatedAt",
    "_id",
    "__v",
    "isActive",
];

export const getProfile = async (restaurant) => {
    return formatRestaurantProfile(restaurant);
};

export const updateProfile = async (restaurant, updates) => {
    if (!updates || typeof updates !== "object" || Object.keys(updates).length === 0) {
        throw new AppError("No fields provided to update", 400);
    }

    const forbiddenFields = Object.keys(updates).filter((field) => PROTECTED_FIELDS.includes(field));

    if (forbiddenFields.length > 0) {
        throw new AppError(`These fields cannot be updated: ${forbiddenFields.join(", ")}`, 400);
    }

    const invalidFields = Object.keys(updates).filter((field) => !EDITABLE_FIELDS.includes(field));

    if (invalidFields.length > 0) {
        throw new AppError(`Invalid fields: ${invalidFields.join(", ")}`, 400);
    }

    for (const field of EDITABLE_FIELDS) {
        if (updates[field] === undefined) continue;

        if (typeof updates[field] !== "string") {
            throw new AppError(`${field} must be a string`, 400);
        }

        const trimmedValue = updates[field].trim();

        if (field === "name" && !trimmedValue) {
            throw new AppError("Name cannot be empty", 400);
        }

        if (field === "phone" && trimmedValue && !isPhoneValid(trimmedValue)) {
            throw new AppError("Invalid phone number format. Use international format e.g. +91XXXXXXXXXX", 400);
        }

        restaurant[field] = trimmedValue;

        if (field === "address") {
            restaurant.location = trimmedValue;
        }
    }

    await restaurant.save();

    return formatRestaurantProfile(restaurant);
};

export const uploadRestaurantLogo = async (restaurant, fileBuffer) => {
    if (!fileBuffer?.length) {
        throw new AppError("Logo file is required", 400);
    }

    const { url, publicId } = await cloudinaryService.replaceImage(
        fileBuffer,
        restaurant.logoPublicId || null,
    );

    restaurant.logo = url;
    restaurant.logoPublicId = publicId;
    await restaurant.save();

    return formatRestaurantProfile(restaurant);
};

export const removeRestaurantLogo = async (restaurant) => {
    if (restaurant.logoPublicId) {
        await cloudinaryService.deleteImage(restaurant.logoPublicId);
    }

    restaurant.logo = "";
    restaurant.logoPublicId = "";
    await restaurant.save();

    return formatRestaurantProfile(restaurant);
};
