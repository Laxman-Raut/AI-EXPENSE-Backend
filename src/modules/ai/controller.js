const cloudinary = require("../../config/cloudinary");
const { scanReceipt } = require("./service");

const scanReceiptController = async (req, res) => {
    try {
        let buffer;
        let mimetype;
        let secureUrl;

        if (req.file) {
            buffer = req.file.buffer;
            mimetype = req.file.mimetype;
            const image = `data:${mimetype};base64,${buffer.toString("base64")}`;
            const uploadResult = await cloudinary.uploader.upload(image, {
                folder: "AIExpenseTracker/Receipts"
            });
            secureUrl = uploadResult.secure_url;
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
        } else {
            return res.status(400).json({
                success: false,
                message: "Receipt image file or receiptUrl is required."
            });
        }

        const base64Data = buffer.toString("base64");
        const data = await scanReceipt(base64Data, mimetype);

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
    }
};

module.exports = {
    scanReceiptController
};