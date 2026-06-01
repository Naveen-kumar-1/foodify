import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
import { AppError } from "../middleware/errorHandler.js";

const LOGO_FOLDER = "foodify/logos";

export const uploadImage = (buffer, { folder = LOGO_FOLDER, publicId } = {}) => {
    if (!isCloudinaryConfigured) {
        throw new AppError("Image upload is not configured", 503);
    }

    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder,
            resource_type: "image",
            overwrite: Boolean(publicId),
            ...(publicId ? { public_id: publicId } : {}),
        };

        const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, result) => {
            if (err) return reject(err);
            resolve({
                url: result.secure_url,
                publicId: result.public_id,
            });
        });

        stream.end(buffer);
    });
};

export const deleteImage = async (publicId) => {
    if (!publicId || !isCloudinaryConfigured) return;
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    } catch {
        // ignore cleanup failures
    }
};

export const replaceImage = async (buffer, oldPublicId, options = {}) => {
    if (oldPublicId) await deleteImage(oldPublicId);
    return uploadImage(buffer, options);
};
