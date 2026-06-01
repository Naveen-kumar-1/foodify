import * as tableService from "../services/tableService.js";
import * as tableExportService from "../services/tableExportService.js";
import { AppError } from "../middleware/errorHandler.js";
import {
    validateBulkCreateBody,
    validateCreateTableBody,
    validateUpdateTableBody,
} from "../validations/tableValidation.js";

export const createTable = async (req, res) => {
    const payload = validateCreateTableBody(req.body);
    const table = await tableService.createTable(req.restaurantId, payload);
    res.status(201).json({ message: "Table created", table, qrImageUrl: tableService.getQrImageUrl(table.qrToken) });
};

export const getTables = async (req, res) => {
    const tables = await tableService.getTables(req.restaurantId);
    res.status(200).json({
        data: tables.map((t) => ({ ...t, qrImageUrl: tableService.getQrImageUrl(t.qrToken) })),
    });
};

export const updateTable = async (req, res) => {
    const payload = validateUpdateTableBody(req.body);
    const table = await tableService.updateTable(req.restaurantId, req.params.tableId, payload);
    res.status(200).json({ message: "Table updated", table });
};

export const regenerateQr = async (req, res) => {
    const table = await tableService.regenerateQrToken(req.restaurantId, req.params.tableId);
    res.status(200).json({
        message: "QR regenerated",
        table,
        qrImageUrl: tableService.getQrImageUrl(table.qrToken),
    });
};

export const deleteTable = async (req, res) => {
    const result = await tableService.deleteTable(req.restaurantId, req.params.tableId);
    res.status(200).json(result);
};

export const bulkTableAction = async (req, res) => {
    const { tableIds, action } = req.body;
    const result = await tableService.bulkTableAction(req.restaurantId, { tableIds, action });
    res.status(200).json(result);
};

export const bulkCreateTables = async (req, res) => {
    const payload = validateBulkCreateBody(req.body);
    const result = await tableService.createTablesBulk(req.restaurantId, payload);
    const data = result.created.map((t) => ({
        ...t,
        qrImageUrl: tableService.getQrImageUrl(t.qrToken),
    }));
    res.status(201).json({
        message: `${result.total} table(s) created`,
        data,
        skipped: result.skipped,
    });
};

export const exportQrZip = async (req, res) => {
    try {
        await tableExportService.streamTablesZip(req.restaurantId, res);
    } catch (err) {
        throw new AppError(err.message || "Export failed", 400);
    }
};

export const exportQrPdf = async (req, res) => {
    try {
        await tableExportService.streamTablesPdf(req.restaurantId, res);
    } catch (err) {
        throw new AppError(err.message || "Export failed", 400);
    }
};
