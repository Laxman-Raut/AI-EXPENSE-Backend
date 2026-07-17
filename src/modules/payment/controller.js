const { createOrder } = require("./service");

const createPaymentOrder = async (req, res) => {
  try {
    const { plan } = req.body;

    const result = await createOrder(req.user.userId, plan);

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPaymentOrder,
};