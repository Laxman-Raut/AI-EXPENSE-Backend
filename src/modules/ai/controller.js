const cloudinary = require("../../config/cloudinary");
const { scanReceipt } = require("./service");

const scanReceiptController = async (req, res) => {
    let publicId = null;
    let secureUrl = null;

    try {
        let buffer;
        let mimetype;
        let geminiBase64Data;
        let textData = null;

        // ─────────────────────────────────────────────────────────────
        // PATH A: Multipart file upload (images + PDFs from gallery/camera/picker)
        // ─────────────────────────────────────────────────────────────
        if (req.file) {
            buffer = req.file.buffer;
            mimetype = req.file.mimetype;
            console.log(`[AI Scanner] PATH A — Multipart file received`);
            console.log(`[AI Scanner] File name: ${req.file.originalname}`);
            console.log(`[AI Scanner] MIME type: ${mimetype}`);
            console.log(`[AI Scanner] Buffer size: ${buffer.length} bytes`);

            geminiBase64Data = buffer.toString("base64");

            // Extract spreadsheet sheets as CSV text to send directly in prompt
            if (
                mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                mimetype === "application/vnd.ms-excel" ||
                (req.file.originalname && (req.file.originalname.endsWith(".xlsx") || req.file.originalname.endsWith(".xls")))
            ) {
                try {
                    const XLSX = require("xlsx");
                    const workbook = XLSX.read(buffer, { type: "buffer" });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    textData = XLSX.utils.sheet_to_csv(worksheet);
                    console.log(`[AI Scanner] Extracted spreadsheet CSV, length: ${textData.length}`);
                } catch (excelErr) {
                    console.error("[AI Scanner] XLSX parsing failed:", excelErr);
                }
            } else if (
                mimetype === "text/csv" ||
                mimetype === "text/plain" ||
                (req.file.originalname && (req.file.originalname.endsWith(".csv") || req.file.originalname.endsWith(".txt")))
            ) {
                textData = buffer.toString("utf-8");
                console.log(`[AI Scanner] Extracted plain text, length: ${textData.length}`);
            }

            // Upload to Cloudinary using upload_stream (supports PDF and raw files natively)
            console.log(`[AI Scanner] Uploading to Cloudinary (resource_type: auto)...`);
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "AIExpenseTracker/Receipts",
                        resource_type: "auto"
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(buffer);
            });
            secureUrl = uploadResult.secure_url;
            publicId = uploadResult.public_id;
            console.log(`[AI Scanner] Cloudinary upload success — publicId: ${publicId}`);
            console.log(`[AI Scanner] Cloudinary URL: ${secureUrl}`);
        }

        // ─────────────────────────────────────────────────────────────
        // PATH B: PDF shared via Android content:// URI → sent as base64 JSON body
        // The frontend reads the file bytes using react-native-blob-util and sends
        // { pdfBase64: string, mimeType: string, fileName: string } as JSON.
        // This bypasses the broken FormData + content:// URI combination for PDFs.
        // ─────────────────────────────────────────────────────────────
        else if (req.body.pdfBase64) {
            const base64str = req.body.pdfBase64;
            mimetype = req.body.mimeType || "application/pdf";
            const fileName = req.body.fileName || "document.pdf";

            console.log(`[AI Scanner] PATH B — PDF base64 body received`);
            console.log(`[AI Scanner] File name: ${fileName}`);
            console.log(`[AI Scanner] MIME type: ${mimetype}`);
            console.log(`[AI Scanner] Base64 length: ${base64str.length} chars`);

            buffer = Buffer.from(base64str, "base64");
            geminiBase64Data = base64str; // already base64, pass directly
            console.log(`[AI Scanner] Decoded buffer size: ${buffer.length} bytes`);

            // Upload to Cloudinary
            console.log(`[AI Scanner] Uploading PDF to Cloudinary (resource_type: auto)...`);
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "AIExpenseTracker/Receipts",
                        resource_type: "auto",
                        public_id: `pdf_${Date.now()}`,
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(buffer);
            });
            secureUrl = uploadResult.secure_url;
            publicId = uploadResult.public_id;
            console.log(`[AI Scanner] Cloudinary upload success — publicId: ${publicId}`);
            console.log(`[AI Scanner] Cloudinary URL: ${secureUrl}`);
        }

        // ─────────────────────────────────────────────────────────────
        // PATH C: Receipt URL (existing functionality — preserved)
        // ─────────────────────────────────────────────────────────────
        else if (req.body.receiptUrl) {
            console.log(`[AI Scanner] PATH C — Receipt URL received: ${req.body.receiptUrl}`);
            const response = await fetch(req.body.receiptUrl);
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
            mimetype = response.headers.get('content-type') || 'image/jpeg';
            geminiBase64Data = buffer.toString("base64");
            console.log(`[AI Scanner] Fetched URL — MIME type: ${mimetype}, size: ${buffer.length} bytes`);

            // Upload to Cloudinary
            const imageBase64 = `data:${mimetype};base64,${buffer.toString("base64")}`;
            const uploadResult = await cloudinary.uploader.upload(imageBase64, {
                folder: "AIExpenseTracker/Receipts",
                resource_type: "auto"
            });
            secureUrl = uploadResult.secure_url;
            publicId = uploadResult.public_id;
            console.log(`[AI Scanner] Cloudinary upload success — publicId: ${publicId}`);
        }

        else {
            console.warn(`[AI Scanner] No valid input found — req.file: ${!!req.file}, req.body keys: ${Object.keys(req.body).join(', ')}`);
            return res.status(400).json({
                success: false,
                message: "Receipt image file, pdfBase64, or receiptUrl is required."
            });
        }

        // ─────────────────────────────────────────────────────────────
        // Gemini OCR
        // ─────────────────────────────────────────────────────────────
        console.log(`[AI Scanner] Sending to Gemini — mimeType: ${mimetype}`);
        const data = await scanReceipt(geminiBase64Data, mimetype, textData);
        console.log(`[AI Scanner] Gemini scan complete — result: ${JSON.stringify(data)}`);

        res.status(200).json({
            success: true,
            receiptImage: secureUrl,
            data
        });

        // Schedule Cloudinary deletion after 5 minutes (300,000 ms)
        if (publicId) {
            setTimeout(async () => {
                try {
                    console.log(`[Cloudinary Cleanup] Deleting: ${publicId}`);
                    await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
                    console.log(`[Cloudinary Cleanup] Deleted: ${publicId}`);
                } catch (destroyError) {
                    console.error(`[Cloudinary Cleanup] Failed to delete: ${publicId}`, destroyError.message);
                }
            }, 5 * 60 * 1000);
        }

    } catch (error) {
        console.error("[AI Scanner] Fatal error:", error.message);
        console.error("[AI Scanner] Stack:", error.stack);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    scanReceiptController
};