const autoPayService = require("./autopay.service");

const enableAutoPay = async (req, res) => {
  try {
    const data = await autoPayService.enableAutoPay(req.user.userId);

    res.status(200).json({
      success: true,
      message: "AutoPay subscription created successfully.",
      data,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  enableAutoPay,
};