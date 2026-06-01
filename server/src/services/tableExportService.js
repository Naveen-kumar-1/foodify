import PDFDocument from "pdfkit";

import Restaurant from "../model/Restaurant.js";
import { getTablesWithQrImages, getQrImageUrl } from "./tableService.js";

/** Lazy-load archiver (ESM-only v8) — required for Vercel/CJS serverless bundles */
let archiverFactory = null;

const getArchiver = async () => {
    if (!archiverFactory) {
        const mod = await import("archiver");
        archiverFactory = mod.default ?? mod;
    }
    return archiverFactory;
};

const fetchQrBuffer = async (qrToken) => {
    const url = getQrImageUrl(qrToken);
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch QR image");
    return Buffer.from(await res.arrayBuffer());
};

export const streamTablesZip = async (restaurantId, res) => {
    const [tables, restaurant] = await Promise.all([
        getTablesWithQrImages(restaurantId),
        Restaurant.findOne({ restaurantId }),
    ]);

    if (!tables.length) {
        throw new Error("No tables to export");
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="foodify-qr-codes-${restaurant?.name || restaurantId}.zip"`,
    );

    const archiver = await getArchiver();
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
        throw err;
    });
    archive.pipe(res);

    for (const table of tables) {
        const buffer = await fetchQrBuffer(table.qrToken);
        archive.append(buffer, {
            name: `table-${table.tableNumber}-${table.tableName.replace(/\s+/g, "-")}.png`,
        });
    }

    await archive.finalize();
};

export const streamTablesPdf = async (restaurantId, res) => {
    const [tables, restaurant] = await Promise.all([
        getTablesWithQrImages(restaurantId),
        Restaurant.findOne({ restaurantId }),
    ]);

    if (!tables.length) {
        throw new Error("No tables to export");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="foodify-qr-codes-${restaurant?.name || restaurantId}.pdf"`,
    );

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    const restaurantName = restaurant?.name || "Restaurant";
    const logoUrl = restaurant?.logo;

    for (let i = 0; i < tables.length; i++) {
        if (i > 0) doc.addPage();

        const table = tables[i];
        let y = 50;

        if (logoUrl) {
            try {
                const logoRes = await fetch(logoUrl);
                if (logoRes.ok) {
                    const logoBuf = Buffer.from(await logoRes.arrayBuffer());
                    doc.image(logoBuf, 40, y, { width: 64, height: 64, fit: [64, 64] });
                }
            } catch {
                // skip logo on failure
            }
        }

        doc.fontSize(22).text(restaurantName, 120, y + 10);
        y += 90;
        doc.fontSize(18).text(`Table ${table.tableNumber}`, 40, y, { align: "center" });
        y += 28;
        doc.fontSize(12).fillColor("#666").text(table.tableName, 40, y, { align: "center" });
        y += 40;

        try {
            const qrBuf = await fetchQrBuffer(table.qrToken);
            const qrSize = 220;
            const x = (doc.page.width - qrSize) / 2;
            doc.image(qrBuf, x, y, { width: qrSize, height: qrSize });
            y += qrSize + 20;
        } catch {
            doc.text("QR unavailable", 40, y, { align: "center" });
        }

        doc.fillColor("#999").fontSize(10).text("Scan to order", 40, y, { align: "center" });
        doc.fillColor("#000");
    }

    doc.end();
};
