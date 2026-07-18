const {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentById,
} = require("./service");



// Create Razorpay Order


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

// Verify Payment
const verifyPaymentController = async (req, res) => {
  try {
    const result = await verifyPayment(req.body);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Payment History
const paymentHistory = async (req, res) => {
  try {
    const payments = await getPaymentHistory(req.user.userId);

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Payment Details
const paymentDetails = async (req, res) => {
  try {
    const payment = await getPaymentById(
      req.params.id,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      data: payment,
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
  verifyPaymentController,
  paymentHistory,
  paymentDetails,
};