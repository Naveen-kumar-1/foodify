import express from "express";
import {
    bulkCreateTables,
    bulkTableAction,
    createTable,
    deleteTable,
    exportQrPdf,
    exportQrZip,
    getTables,
    regenerateQr,
    updateTable,
} from "../controller/tableController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();
router.use(authenticate);

router.post("/bulk", asyncHandler(bulkCreateTables));
router.post("/bulk-action", asyncHandler(bulkTableAction));
router.get("/export/zip", asyncHandler(exportQrZip));
router.get("/export/pdf", asyncHandler(exportQrPdf));
router.post("/", asyncHandler(createTable));
router.get("/", asyncHandler(getTables));
router.put("/:tableId", asyncHandler(updateTable));
router.post("/:tableId/regenerate-qr", asyncHandler(regenerateQr));
router.delete("/:tableId", asyncHandler(deleteTable));

export default router;
