import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import Table from "../model/Table.js";
import { AppError } from "../middleware/errorHandler.js";

const clientBaseUrl = () =>
    process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";

const buildQrUrl = (qrToken) => `${clientBaseUrl()}/order/${qrToken}`;

const sanitizeTable = (table) => ({
    tableId: table.tableId,
    restaurantId: table.restaurantId,
    tableName: table.tableName,
    tableNumber: table.tableNumber,
    qrToken: table.qrToken,
    qrUrl: buildQrUrl(table.qrToken),
    isActive: table.isActive,
    createdAt: table.createdAt,
    updatedAt: table.updatedAt,
});

export const createTable = async (restaurantId, payload) => {
    const existing = await Table.findOne({ restaurantId, tableNumber: payload.tableNumber });
    if (existing) throw new AppError("Table number already exists", 400);

    const table = await Table.create({
        tableId: uuidv4(),
        restaurantId,
        tableName: payload.tableName,
        tableNumber: payload.tableNumber,
        qrToken: crypto.randomBytes(16).toString("hex"),
    });

    return sanitizeTable(table);
};

export const getTables = async (restaurantId) => {
    const tables = await Table.find({ restaurantId }).sort({ tableNumber: 1 });
    return tables.map(sanitizeTable);
};

export const getTableById = async (restaurantId, tableId) => {
    const table = await Table.findOne({ restaurantId, tableId });
    if (!table) throw new AppError("Table not found", 404);
    return sanitizeTable(table);
};

export const getTableByQrToken = async (qrToken) => {
    const table = await Table.findOne({ qrToken, isActive: true });
    if (!table) throw new AppError("Invalid or inactive QR code", 404);
    return table;
};

export const updateTable = async (restaurantId, tableId, payload) => {
    const table = await Table.findOneAndUpdate(
        { restaurantId, tableId },
        { $set: payload },
        { new: true },
    );
    if (!table) throw new AppError("Table not found", 404);
    return sanitizeTable(table);
};

export const regenerateQrToken = async (restaurantId, tableId) => {
    const table = await Table.findOneAndUpdate(
        { restaurantId, tableId },
        { $set: { qrToken: crypto.randomBytes(16).toString("hex") } },
        { new: true },
    );
    if (!table) throw new AppError("Table not found", 404);
    return sanitizeTable(table);
};

export const deleteTable = async (restaurantId, tableId) => {
    const table = await Table.findOneAndDelete({ restaurantId, tableId });
    if (!table) throw new AppError("Table not found", 404);
    return { message: "Table deleted successfully" };
};

export const getQrImageUrl = (qrToken) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(buildQrUrl(qrToken))}`;

export const createTablesBulk = async (restaurantId, { count, namingPattern, startingNumber }) => {
    const created = [];
    const skipped = [];

    for (let i = 0; i < count; i++) {
        const num = startingNumber + i;
        const tableNumber = String(num);
        const tableName = `${namingPattern} ${num}`.trim();

        const existing = await Table.findOne({ restaurantId, tableNumber });
        if (existing) {
            skipped.push(tableNumber);
            continue;
        }

        const table = await Table.create({
            tableId: uuidv4(),
            restaurantId,
            tableName,
            tableNumber,
            qrToken: crypto.randomBytes(16).toString("hex"),
        });

        created.push(sanitizeTable(table));
    }

    if (!created.length && skipped.length) {
        throw new AppError("All table numbers in this range already exist", 400);
    }

    return { created, skipped, total: created.length };
};

export const bulkTableAction = async (restaurantId, { tableIds, action }) => {
    if (!Array.isArray(tableIds) || !tableIds.length) {
        throw new AppError("No tables selected", 400);
    }

    const filter = { restaurantId, tableId: { $in: tableIds } };

    switch (action) {
        case "delete": {
            const result = await Table.deleteMany(filter);
            return { message: `${result.deletedCount} table(s) deleted`, count: result.deletedCount };
        }
        case "disable": {
            const result = await Table.updateMany(filter, { $set: { isActive: false } });
            return { message: `${result.modifiedCount} table(s) disabled`, count: result.modifiedCount };
        }
        case "enable": {
            const result = await Table.updateMany(filter, { $set: { isActive: true } });
            return { message: `${result.modifiedCount} table(s) enabled`, count: result.modifiedCount };
        }
        default:
            throw new AppError("Invalid bulk action", 400);
    }
};

export const getTablesWithQrImages = async (restaurantId) => {
    const tables = await getTables(restaurantId);
    return tables.map((t) => ({
        ...t,
        qrImageUrl: getQrImageUrl(t.qrToken),
    }));
};
