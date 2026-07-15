const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "AI Expense Tracker - Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Password Reset Request</h2>
        <p>Your OTP is:</p>
        <h1 style="color:#4CAF50;">${otp}</h1>
        <p>This OTP is valid for <strong>5 minutes</strong>.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

const sendSupportEmail = async ({ userEmail, userName, subject, message }) => {
  // 1. Send email to support team (our email)
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: `[Help & Support Request] - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">New Help & Support Request</h2>
        <p><strong>From:</strong> ${userName} (&lt;${userEmail}&gt;)</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0;">
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
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #2196F3; border-bottom: 2px solid #2196F3; padding-bottom: 10px;">Support Request Confirmed</h2>
        <p>Hi ${userName},</p>
        <p>Thank you for contacting AI Expense Tracker support. We have received your message and will get back to you as soon as possible.</p>
        <p>For your reference, here is a summary of your request:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2196F3; margin: 15px 0;">
          <p><strong>Subject:</strong> ${subject}</p>
          <p style="white-space: pre-wrap; margin: 0;">${message}</p>
        </div>
        <p>Best regards,<br/>AI Expense Tracker Support Team</p>
      </div>
    `,
  });
};

module.exports = {
  sendOtpEmail,
  sendSupportEmail,
};