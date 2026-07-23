const PDFDocument = require("pdfkit");

/**
 * Generates a PDF buffer for a subscription invoice receipt.
 */
const generateInvoicePdfBuffer = ({
  userName,
  userEmail,
  planName,
  amount,
  currency = "INR",
  orderId = "N/A",
  paymentId = "N/A",
  paidAt,
  startDate,
  endDate,
  provider = "Razorpay",
}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const primaryColor = "#4B8CFF";
      const secondaryColor = "#8A3FFC";
      const darkColor = "#1E293B";
      const grayColor = "#64748B";
      const lightBg = "#F8FAFC";
      const greenColor = "#10B981";

      // 1. Header Banner / Logo
      doc.rect(40, 40, 515, 70).fill(primaryColor);

      doc
        .fillColor("#FFFFFF")
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("AI EXPENSE TRACKER", 55, 55);

      doc
        .fontSize(9)
        .font("Helvetica")
        .text("OFFICIAL PAYMENT RECEIPT & INVOICE", 55, 82);

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("PAID", 475, 65, { align: "right" });

      // 2. Receipt Meta Info
      const startY = 130;

      // Left column - Billed To
      doc
        .fillColor(grayColor)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("BILLED TO:", 40, startY);

      doc
        .fillColor(darkColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(userName || "Valued Customer", 40, startY + 15);

      doc
        .fillColor(grayColor)
        .fontSize(10)
        .font("Helvetica")
        .text(userEmail, 40, startY + 30);

      // Right column - Invoice Details
      doc
        .fillColor(grayColor)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("INVOICE DETAILS:", 330, startY);

      doc
        .fillColor(grayColor)
        .fontSize(9)
        .font("Helvetica")
        .text(`Receipt Date: ${paidAt}`, 330, startY + 15)
        .text(`Order ID: ${orderId}`, 330, startY + 30)
        .text(`Payment ID: ${paymentId}`, 330, startY + 45)
        .text(`Payment Provider: ${provider}`, 330, startY + 60);

      // 3. Plan & Coverage Box
      const boxY = startY + 85;
      doc
        .rect(40, boxY, 515, 45)
        .fillAndStroke(lightBg, "#E2E8F0");

      doc
        .fillColor(secondaryColor)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("ACTIVE SUBSCRIPTION PERIOD:", 55, boxY + 10);

      doc
        .fillColor(darkColor)
        .fontSize(10)
        .font("Helvetica")
        .text(`${startDate}  to  ${endDate}`, 55, boxY + 25);

      // 4. Table Header
      const tableY = boxY + 60;
      doc
        .rect(40, tableY, 515, 25)
        .fill(darkColor);

      doc
        .fillColor("#FFFFFF")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("DESCRIPTION", 55, tableY + 8)
        .text("BILLING CYCLE", 280, tableY + 8)
        .text("AMOUNT", 450, tableY + 8, { align: "right" });

      // 5. Table Row
      const rowY = tableY + 35;
      doc
        .fillColor(darkColor)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(planName, 55, rowY);

      doc
        .fillColor(grayColor)
        .fontSize(9)
        .font("Helvetica")
        .text(planName.includes("Yearly") ? "Annual" : "Monthly", 280, rowY);

      const symbol = currency === "INR" ? "INR " : "$";
      doc
        .fillColor(darkColor)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`${symbol}${amount}.00`, 450, rowY, { align: "right" });

      doc
        .moveTo(40, rowY + 25)
        .lineTo(555, rowY + 25)
        .strokeColor("#E2E8F0")
        .stroke();

      // 6. Summary / Total Box
      const summaryY = rowY + 40;

      doc
        .fillColor(grayColor)
        .fontSize(10)
        .font("Helvetica")
        .text("Subtotal:", 330, summaryY, { align: "right" })
        .text("Tax (0%):", 330, summaryY + 18, { align: "right" });

      doc
        .fillColor(darkColor)
        .fontSize(10)
        .font("Helvetica")
        .text(`${symbol}${amount}.00`, 450, summaryY, { align: "right" })
        .text(`${symbol}0.00`, 450, summaryY + 18, { align: "right" });

      doc
        .rect(330, summaryY + 38, 225, 30)
        .fill(greenColor);

      doc
        .fillColor("#FFFFFF")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("TOTAL PAID:", 345, summaryY + 47)
        .text(`${symbol}${amount}.00`, 450, summaryY + 47, { align: "right" });

      // 7. Footer
      doc
        .fillColor(grayColor)
        .fontSize(9)
        .font("Helvetica")
        .text(
          "Thank you for choosing AI Expense Tracker! If you have any questions regarding this invoice, please reach out to us at support@aiexpensetracker.com",
          40,
          720,
          { align: "center", width: 515 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateInvoicePdfBuffer;
