const cloudinary = require("../../config/cloudinary");
const { scanReceipt } = require("./service");

const scanReceiptController = async (req, res) => {
    let publicId = null;
    let secureUrl = null;

    try {
        let buffer;
        let mimetype;

        if (req.file) {
            buffer = req.file.buffer;
            mimetype = req.file.mimetype;
            const image = `data:${mimetype};base64,${buffer.toString("base64")}`;
            const uploadResult = await cloudinary.uploader.upload(image, {
                folder: "AIExpenseTracker/Receipts"
            });
            secureUrl = uploadResult.secure_url;
            publicId = uploadResult.public_id;
        } else if (req.body.receiptUrl) {
            const response = await fetch(req.body.receiptUrl);
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
            mimetype = response.headers.get('content-type') || 'image/jpeg';
            
            // Upload to Cloudinary
            const imageBase64 = `data:${mimetype};base64,${buffer.toString("base64")}`;
            const uploadResult = await cloudinary.uploader.upload(imageBase64, {
                folder: "AIExpenseTracker/Receipts"
            });
            secureUrl = uploadResult.secure_url;
            publicId = uploadResult.public_id;
        } else {
            return res.status(400).json({
                success: false,
                message: "Receipt image file or receiptUrl is required."
            });
        }

        // Use the secureUrl to send the image to the Gemini receipt scanner (requirement 2)
        const geminiFetchResponse = await fetch(secureUrl);
        const geminiArrayBuffer = await geminiFetchResponse.arrayBuffer();
        const geminiBase64Data = Buffer.from(geminiArrayBuffer).toString("base64");
        
        const data = await scanReceipt(geminiBase64Data, mimetype);

        res.status(200).json({
            success: true,
            receiptImage: secureUrl,
            data
        });

    } catch (error) {
        console.error("AI scanning error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        if (publicId) {
            try {
                console.log(`[Cloudinary Cleanup] Triggering deletion of image: ${publicId}`);
                await cloudinary.uploader.destroy(publicId);
                console.log(`[Cloudinary Cleanup] Successfully deleted image: ${publicId}`);
            } catch (destroyError) {
                console.error(`[Cloudinary Cleanup Error] Failed to delete image ${publicId}:`, destroyError);
                // Do not fail the request if the scan was already completed successfully
            }
        }
    }
};

module.exports = {
    scanReceiptController
};