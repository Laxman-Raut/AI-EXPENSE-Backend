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
    console.log(` Subscription Invoice email with PDF receipt sent successfully to ${userEmail}`);
  } catch (error) {
    console.error("Failed to send Subscription Invoice email:", error);
  }
};

 // sendsplitExpense email

const sendSplitExpenseEmail = async ({
  userEmail,
  userName,
  expenseTitle,
  totalAmount,
  yourShare,
  paidBy,
  date,
}) => {
  const formattedDate = date ? new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) : new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  await transporter.sendMail({
    from: `AI Expense Tracker <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `New Shared Expense: ${expenseTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Shared Expense</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #090A0F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #090A0F; padding: 30px 10px;">
          <tr>
            <td align="center">
              
              <!-- Outer Card Container -->
              <table role="presentation" width="100%" style="max-width: 540px; background-color: #12131A; border: 1px solid #222533; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 32px rgba(0,0,0,0.5);">
                
                <!-- Brand Header Bar -->
                <tr>
                  <td style="padding: 28px 32px 20px 32px; background: linear-gradient(135deg, #181926 0%, #12131A 100%); border-bottom: 1px solid #1F2233;">
                    <table width="100%">
                      <tr>
                        <td>
                          <span style="font-size: 13px; font-weight: 800; color: #8A3FFC; letter-spacing: 1.5px; text-transform: uppercase;">
                            ✨ AI EXPENSE TRACKER
                          </span>
                          <h1 style="margin: 6px 0 0 0; font-size: 22px; font-weight: 800; color: #FFFFFF;">
                            New Shared Expense
                          </h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 28px 32px;">
                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #A0A5B5; line-height: 1.6;">
                      Hello <strong style="color: #FFFFFF;">${userName}</strong>, you've been added to a new shared expense split. Here are the details:
                    </p>

                    <!-- Hero Callout Box: Your Share -->
                    <table width="100%" style="background: linear-gradient(135deg, rgba(138,63,252,0.15) 0%, rgba(94,27,219,0.08) 100%); border: 1px solid rgba(138,63,252,0.3); border-radius: 14px; margin-bottom: 24px; text-align: center; padding: 20px;">
                      <tr>
                        <td>
                          <span style="font-size: 12px; font-weight: 700; color: #A366FF; text-transform: uppercase; letter-spacing: 1px;">
                            YOUR SHARE TO PAY
                          </span>
                          <div style="font-size: 34px; font-weight: 900; color: #FFFFFF; margin-top: 4px; letter-spacing: -0.5px;">
                            ₹${yourShare}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Details Table -->
                    <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #181924; border: 1px solid #222535; border-radius: 12px; padding: 14px 18px;">
                      
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #222535; font-size: 13px; color: #8E949A; font-weight: 600;">Expense Title</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #222535; font-size: 14px; color: #FFFFFF; font-weight: 700; text-align: right;">${expenseTitle}</td>
                      </tr>

                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #222535; font-size: 13px; color: #8E949A; font-weight: 600;">Paid By</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #222535; font-size: 14px; color: #FFFFFF; font-weight: 700; text-align: right;">${paidBy}</td>
                      </tr>

                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #222535; font-size: 13px; color: #8E949A; font-weight: 600;">Total Bill Amount</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #222535; font-size: 14px; color: #FFFFFF; font-weight: 700; text-align: right;">₹${totalAmount}</td>
                      </tr>

                      <tr>
                        <td style="padding: 10px 0; font-size: 13px; color: #8E949A; font-weight: 600;">Date</td>
                        <td style="padding: 10px 0; font-size: 14px; color: #FFFFFF; font-weight: 700; text-align: right;">${formattedDate}</td>
                      </tr>

                    </table>

                    <!-- CTA Call To Action Button -->
                    <table width="100%" cellspacing="0" cellpadding="0" style="margin-top: 28px;">
                      <tr>
                        <td align="center">
                          <a href="#" style="display: inline-block; background-color: #8A3FFC; color: #FFFFFF; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 50px; text-decoration: none; box-shadow: 0 4px 16px rgba(138,63,252,0.4);">
                            Open AI Expense Tracker
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; background-color: #0E0F15; border-top: 1px solid #1F2233; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #54595E; line-height: 1.5;">
                      This is an automated notification from AI Expense Tracker.<br/>
                      Please do not reply directly to this email.
                    </p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};

// Send Registration Verification OTP Email
const sendVerificationOtpEmail = async (email, fullName, otp) => {
  await transporter.sendMail({
    from: `AI Expense Tracker <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "AI Expense Tracker - Verify Your Account",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #090A0F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #090A0F; padding: 30px 10px;">
          <tr>
            <td align="center">
              
              <table role="presentation" width="100%" style="max-width: 500px; background-color: #12131A; border: 1px solid #222533; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 32px rgba(0,0,0,0.5);">
                
                <tr>
                  <td style="padding: 28px 32px 20px 32px; background: linear-gradient(135deg, #181926 0%, #12131A 100%); border-bottom: 1px solid #1F2233; text-align: center;">
                    <span style="font-size: 13px; font-weight: 800; color: #8A3FFC; letter-spacing: 1.5px; text-transform: uppercase;">
                      ✨ AI EXPENSE TRACKER
                    </span>
                    <h1 style="margin: 8px 0 0 0; font-size: 22px; font-weight: 800; color: #FFFFFF;">
                      Verify Your Email Address
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 28px 32px; text-align: center;">
                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #A0A5B5; line-height: 1.6; text-align: left;">
                      Hello <strong style="color: #FFFFFF;">${fullName || 'User'}</strong>,<br/><br/>
                      Thank you for signing up for AI Expense Tracker! Please enter the 6-digit verification code below to activate your account:
                    </p>

                    <div style="background: linear-gradient(135deg, rgba(138,63,252,0.15) 0%, rgba(94,27,219,0.08) 100%); border: 1px solid rgba(138,63,252,0.3); border-radius: 14px; padding: 20px; margin: 24px 0;">
                      <span style="font-size: 11px; font-weight: 700; color: #A366FF; text-transform: uppercase; letter-spacing: 1.5px;">YOUR VERIFICATION CODE</span>
                      <div style="font-size: 36px; font-weight: 900; color: #8A3FFC; letter-spacing: 8px; margin-top: 6px; font-family: monospace;">
                        ${otp}
                      </div>
                    </div>

                    <p style="margin: 0; font-size: 13px; color: #6C727F; line-height: 1.5;">
                      This code is valid for <strong>10 minutes</strong>. If you did not create an account, please ignore this email.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 20px 32px; background-color: #0E0F15; border-top: 1px solid #1F2233; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #54595E;">
                      © ${new Date().getFullYear()} AI Expense Tracker. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};

module.exports = {
  sendOtpEmail,
  sendSupportEmail,
  sendWelcomeEmail,
  sendSubscriptionEmail,
  sendInvoiceEmail,
  sendSplitExpenseEmail,
  sendVerificationOtpEmail,
};
