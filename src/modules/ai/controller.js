const cloudinary = require("../../config/cloudinary");
const { scanReceipt } = require("./service");

const scanReceiptController = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Receipt image is required."
            });
        }

        const image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

        const uploadResult = await cloudinary.uploader.upload(image, {
            folder: "AIExpenseTracker/Receipts"
        });

        const base64Data = req.file.buffer.toString("base64");
        const data = await scanReceipt(base64Data, req.file.mimetype);

        res.status(200).json({
            success: true,
            receiptImage: uploadResult.secure_url,
            data
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

module.exports = {
    scanReceiptController
};