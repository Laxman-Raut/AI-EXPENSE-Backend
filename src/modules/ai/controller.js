const cloudinary = require("../../config/cloudinary");
const { scanReceipt } = require("./service");

const scanReceiptController = async (req, res) => {
    let publicId = null;
    let secureUrl = null;

    try {
        let buffer;
        let mimetype;
        let geminiBase64Data;

        if (req.file) {
            buffer = req.file.buffer;
            mimetype = req.file.mimetype;
            geminiBase64Data = buffer.toString("base64");

            // Upload directly to Cloudinary using upload_stream (supports PDF and raw files natively)
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
        } else if (req.body.receiptUrl) {
            const response = await fetch(req.body.receiptUrl);
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
            mimetype = response.headers.get('content-type') || 'image/jpeg';
            geminiBase64Data = buffer.toString("base64");
            
            // Upload to Cloudinary
            const imageBase64 = `data:${mimetype};base64,${buffer.toString("base64")}`;
            const uploadResult = await cloudinary.uploader.upload(imageBase64, {
                folder: "AIExpenseTracker/Receipts",
                resource_type: "auto"
            });
            secureUrl = uploadResult.secure_url;
            publicId = uploadResult.public_id;
        } else {
            return res.status(400).json({
                success: false,
                message: "Receipt image file or receiptUrl is required."
            });
        }
        
        const data = await scanReceipt(geminiBase64Data, mimetype);

        res.status(200).json({
            success: true,
            receiptImage: secureUrl,
            data
        });

        // Schedule Cloudinary deletion after 5 minutes (300,000 ms)
        if (publicId) {
            setTimeout(async () => {
                try {
                    console.log(`[Cloudinary Delayed Cleanup] Triggering automatic deletion of: ${publicId}`);
                    await cloudinary.uploader.destroy(publicId);
                    console.log(`[Cloudinary Delayed Cleanup] Successfully deleted: ${publicId}`);
                } catch (destroyError) {
                    console.error(`[Cloudinary Delayed Cleanup Error] Failed to delete: ${publicId}`, destroyError);
                }
            }, 5 * 60 * 1000);
        }

    } catch (error) {
        console.error("AI scanning error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    scanReceiptController
};