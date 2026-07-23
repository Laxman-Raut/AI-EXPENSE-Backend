const transporter = require("./transporter");
const welcomeTemplate = require("./templates/welcome");
const invoiceTemplate = require("./templates/invoice");

// Send Password Reset OTP Email
const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "AI Expense Tracker - Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px;">
        <h2 style="color: #8A3FFC;">Password Reset Request</h2>
        <p style="color: #555;">Your OTP for resetting your password is:</p>
        <div style="background-color: #f3f0ff; padding: 15px; text-align: center; border-radius: 6px; margin: 15px 0;">
          <h1 style="color: #8A3FFC; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #666; font-size: 13px;">This OTP is valid for <strong>5 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

// Send Help & Support Email
const sendSupportEmail = async ({ userEmail, userName, subject, message }) => {
  // 1. Send email to support team
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: `[Help & Support Request] - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #8A3FFC; border-bottom: 2px solid #8A3FFC; padding-bottom: 10px;">New Help & Support Request</h2>
        <p><strong>From:</strong> ${userName} (&lt;${userEmail}&gt;)</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #8A3FFC; margin: 15px 0;">
          <p style="white-space: pre-wrap; margin: 0;">${message}</p>
        </div>
      </div>
    `,
  });

  // 2. Send confirmation email to the user
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `We received your support request: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #4B8CFF; border-bottom: 2px solid #4B8CFF; padding-bottom: 10px;">Support Request Confirmed</h2>
        <p>Hi ${userName},</p>
        <p>Thank you for contacting AI Expense Tracker support. We have received your message and will get back to you as soon as possible.</p>
        <p>For your reference, here is a summary of your request:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4B8CFF; margin: 15px 0;">
          <p><strong>Subject:</strong> ${subject}</p>
          <p style="white-space: pre-wrap; margin: 0;">${message}</p>
        </div>
        <p>Best regards,<br/>AI Expense Tracker Support Team</p>
      </div>
    `,
  });
};

// Send Welcome Email
const sendWelcomeEmail = async (email, userName) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Welcome to AI Expense Tracker! 🚀",
    html: welcomeTemplate(userName || "Valued User"),
  });
};

// Send Subscription Status Update Email
const sendSubscriptionEmail = async (email, userName, planName, action) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `AI Expense Tracker - Subscription ${action}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #8A3FFC;">Subscription Update</h2>
        <p>Hi ${userName || "User"},</p>
        <p>Your subscription for plan <strong>${planName}</strong> has been <strong>${action}</strong>.</p>
        <p>Thank you for using AI Expense Tracker!</p>
      </div>
    `,
  });
};

const generateInvoicePdfBuffer = require("./invoicePdfGenerator");

// Send Beautiful Subscription Invoice Email with PDF Attachment
const sendInvoiceEmail = async ({ userEmail, userName, payment, subscription }) => {
  try {
    const planNameFormatted = payment.plan === "pro_yearly" ? "Pro Yearly Plan" : "Pro Monthly Plan";
    const amountFormatted = payment.amount || (payment.plan === "pro_yearly" ? 1999 : 199);
    const paidAtFormatted = payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const startDateFormatted = subscription?.startDate ? new Date(subscription.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const endDateFormatted = subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A";

    const htmlContent = invoiceTemplate({
      userName: userName || "Valued Customer",
      userEmail,
      planName: planNameFormatted,
      amount: amountFormatted,
      currency: payment.currency || "INR",
      orderId: payment.razorpayOrderId || "N/A",
      paymentId: payment.razorpayPaymentId || "N/A",
      paidAt: paidAtFormatted,
      startDate: startDateFormatted,
      endDate: endDateFormatted,
    });

    // Generate Invoice PDF Receipt Buffer
    let pdfBuffer = null;
    try {
      pdfBuffer = await generateInvoicePdfBuffer({
        userName: userName || "Valued Customer",
        userEmail,
        planName: planNameFormatted,
        amount: amountFormatted,
        currency: payment.currency || "INR",
        orderId: payment.razorpayOrderId || "N/A",
        paymentId: payment.razorpayPaymentId || "N/A",
        paidAt: paidAtFormatted,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        provider: payment.provider ? payment.provider.toUpperCase() : "RAZORPAY",
      });
    } catch (pdfErr) {
      console.error("⚠️ Failed to generate invoice PDF buffer:", pdfErr);
    }

    const attachments = [];
    if (pdfBuffer) {
      const fileName = `Invoice_${payment.razorpayOrderId || Date.now()}.pdf`;
      attachments.push({
        filename: fileName,
        content: pdfBuffer,
        contentType: "application/pdf",
      });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Payment Receipt & Invoice for ${planNameFormatted} - AI Expense Tracker`,
      html: htmlContent,
      attachments,
    });
    console.log(`✅ Subscription Invoice email with PDF receipt sent successfully to ${userEmail}`);
  } catch (error) {
    console.error("❌ Failed to send Subscription Invoice email:", error);
  }
};

module.exports = {
  sendOtpEmail,
  sendSupportEmail,
  sendWelcomeEmail,
  sendSubscriptionEmail,
  sendInvoiceEmail,
};
