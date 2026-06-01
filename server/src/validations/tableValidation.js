import { AppError } from "../middleware/errorHandler.js";

export const validateCreateTableBody = (body) => {
    const tableName = body.tableName?.trim();
    const tableNumber = body.tableNumber?.trim();

    if (!tableName) throw new AppError("Table name is required", 400);
    if (!tableNumber) throw new AppError("Table number is required", 400);

    return { tableName, tableNumber };
};

export const validateUpdateTableBody = (body) => {
    const payload = {};
    if (body.tableName !== undefined) {
        const tableName = body.tableName?.trim();
        if (!tableName) throw new AppError("Table name cannot be empty", 400);
        payload.tableName = tableName;
    }
    if (body.tableNumber !== undefined) {
        const tableNumber = body.tableNumber?.trim();
        if (!tableNumber) throw new AppError("Table number cannot be empty", 400);
        payload.tableNumber = tableNumber;
    }
    if (body.isActive !== undefined) payload.isActive = Boolean(body.isActive);
    if (!Object.keys(payload).length) throw new AppError("No valid fields to update", 400);
    return payload;
};

export const validateBulkCreateBody = (body) => {
    const count = Number(body.count);
    const startingNumber = Number(body.startingNumber ?? 1);
    const namingPattern = (body.namingPattern || "Table").trim();

    if (!Number.isInteger(count) || count < 1 || count > 200) {
        throw new AppError("Number of tables must be between 1 and 200", 400);
    }

    if (!Number.isInteger(startingNumber) || startingNumber < 1) {
        throw new AppError("Starting number must be a positive integer", 400);
    }

    if (!namingPattern) {
        throw new AppError("Naming pattern is required", 400);
    }

    return { count, startingNumber, namingPattern };
};
