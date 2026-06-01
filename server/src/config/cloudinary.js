import { v2 as cloudinary } from "cloudinary";

const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_NAME?.trim?.() ||
    process.env.CLOUDINARY_NAME;

const apiKey =
    process.env.CLOUDINARY_API_KEY?.trim?.() || process.env.CLOUDINARY_API_KEY;

const apiSecret =
    process.env.CLOUDINARY_API_SECRET?.trim?.() ||
    process.env.CLOUDINARY_SECRET_KEY?.trim?.() ||
    process.env.CLOUDINARY_API_SECRET ||
    process.env.CLOUDINARY_SECRET_KEY;

if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });
}

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

export default cloudinary;
