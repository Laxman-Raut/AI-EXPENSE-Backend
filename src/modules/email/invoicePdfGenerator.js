const PDFDocument = require("pdfkit");

/**
 * Generates a sleek, professional, and visually stunning PDF invoice buffer.
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
      const doc = new PDFDocument({
        margin: 40,
        size: "A4",
        info: {
          Title: `Invoice - AI Expense Tracker (${orderId})`,
          Author: "AI Expense Tracker Inc.",
          Subject: "Payment Receipt and Subscription Invoice",
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Color Palette
      const C = {
        primary: "#4F46E5",     // Indigo Primary
        primaryLight: "#EEF2FF",// Light Indigo Bg
        darkHeader: "#0F172A",  // Slate 900
        textBody: "#334155",    // Slate 700
        textMuted: "#64748B",   // Slate 500
        cardBg: "#F8FAFC",      // Slate 50
        borderColor: "#E2E8F0", // Slate 200
        successBg: "#DCFCE7",   // Green 100
        successText: "#15803D", // Green 700
        successAccent: "#10B981",// Emerald 500
      };

      const currencyPrefix = currency === "INR" ? "INR " : "$";
      const invoiceNo = `INV-${(orderId || Date.now().toString()).slice(-8).toUpperCase()}`;
      const issueDateFormatted = paidAt || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

      // ─── 1. TOP HEADER BANNER ───────────────────────────────────────────
      // Dark Header Container
      doc.roundedRect(40, 40, 515, 80, 8).fill(C.darkHeader);

      // Brand Title & Subtitle
      doc
        .fillColor("#FFFFFF")
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("AI EXPENSE TRACKER", 60, 56);

      doc
        .fillColor("#94A3B8")
        .fontSize(9)
        .font("Helvetica")
        .text("Smart Financial Intelligence & Expense Management", 60, 82);

      // PAID Badge (Pill) on Right
      doc.roundedRect(445, 60, 90, 30, 15).fill(C.successBg);
      doc
        .fillColor(C.successText)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("PAID", 445, 69, { width: 90, align: "center" });

      // ─── 2. INVOICE TITLE & META BAR ──────────────────────────────────────
      const metaY = 135;
      doc
        .fillColor(C.darkHeader)
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("PAYMENT RECEIPT & INVOICE", 40, metaY);

      doc
        .fillColor(C.textMuted)
        .fontSize(9)
        .font("Helvetica")
        .text(`Invoice No: `, 40, metaY + 22)
        .fillColor(C.textBody)
        .font("Helvetica-Bold")
        .text(invoiceNo, 95, metaY + 22);

      doc
        .fillColor(C.textMuted)
        .fontSize(9)
        .font("Helvetica")
        .text(`Issued Date: `, 350, metaY + 22)
        .fillColor(C.textBody)
        .font("Helvetica-Bold")
        .text(issueDateFormatted, 410, metaY + 22, { align: "right", width: 145 });

      // ─── 3. BILLED TO & PAYMENT INFO CARDS ────────────────────────────────
      const cardsY = 180;
      const cardW = 248;
      const cardH = 95;

      // Card 1: Billed To (Left)
      doc
        .roundedRect(40, cardsY, cardW, cardH, 6)
        .fillAndStroke(C.cardBg, C.borderColor);

      doc
        .fillColor(C.primary)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("BILLED TO", 55, cardsY + 12);

      doc
        .fillColor(C.darkHeader)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(userName || "Valued Customer", 55, cardsY + 28, { width: cardW - 30 });

      doc
        .fillColor(C.textMuted)
        .fontSize(9)
        .font("Helvetica")
        .text(userEmail || "N/A", 55, cardsY + 46, { width: cardW - 30 });

      doc
        .fillColor(C.textMuted)
        .fontSize(8)
        .text("Account Type: Premium Pro User", 55, cardsY + 68);

      // Card 2: Payment Details (Right)
      const rightCardX = 307;
      doc
        .roundedRect(rightCardX, cardsY, cardW, cardH, 6)
        .fillAndStroke(C.cardBg, C.borderColor);

      doc
        .fillColor(C.primary)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("PAYMENT DETAILS", rightCardX + 15, cardsY + 12);

      const renderDetailRow = (label, val, yOff) => {
        doc
          .fillColor(C.textMuted)
          .fontSize(9)
          .font("Helvetica")
          .text(label, rightCardX + 15, cardsY + yOff);
        doc
          .fillColor(C.darkHeader)
          .fontSize(9)
          .font("Helvetica-Bold")
          .text(val, rightCardX + 100, cardsY + yOff, { width: cardW - 115, align: "right" });
      };

      renderDetailRow("Order ID:", orderId.length > 18 ? orderId.slice(0, 18) + "..." : orderId, 28);
      renderDetailRow("Payment ID:", paymentId.length > 18 ? paymentId.slice(0, 18) + "..." : paymentId, 44);
      renderDetailRow("Paid Date:", paidAt || "N/A", 60);
      renderDetailRow("Gateway:", provider, 76);

      // ─── 4. SUBSCRIPTION COVERAGE HIGHLIGHT BANNER ────────────────────────
      const bannerY = cardsY + cardH + 15;
      doc
        .roundedRect(40, bannerY, 515, 42, 6)
        .fillAndStroke(C.primaryLight, C.primary);

      // Left Accent Line
      doc.rect(40, bannerY, 5, 42).fill(C.primary);

      doc
        .fillColor(C.primary)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("ACTIVE SUBSCRIPTION COVERAGE PERIOD", 60, bannerY + 9);

      doc
        .fillColor(C.darkHeader)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`${startDate}   -->   ${endDate}`, 60, bannerY + 23);

      doc
        .fillColor(C.primary)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("STATUS: ACTIVE", 440, bannerY + 16, { width: 100, align: "right" });

      // ─── 5. ITEM TABLE ──────────────────────────────────────────────────
      const tableY = bannerY + 58;

      // Table Header Row
      doc.roundedRect(40, tableY, 515, 26, 4).fill(C.darkHeader);

      doc
        .fillColor("#FFFFFF")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("ITEM / DESCRIPTION", 55, tableY + 8)
        .text("CYCLE", 290, tableY + 8)
        .text("QTY", 370, tableY + 8)
        .text("AMOUNT", 450, tableY + 8, { width: 95, align: "right" });

      // Item Details
      const rowY = tableY + 36;

      doc
        .fillColor(C.darkHeader)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(planName, 55, rowY);

      doc
        .fillColor(C.textMuted)
        .fontSize(8.5)
        .font("Helvetica")
        .text(
          "Includes Unlimited Bank Sync, Shared Family Wallets, AI Receipt OCR & Priority Support.",
          55,
          rowY + 16,
          { width: 220 }
        );

      doc
        .fillColor(C.textBody)
        .fontSize(9.5)
        .font("Helvetica")
        .text(planName.toLowerCase().includes("yearly") ? "Annual" : "Monthly", 290, rowY + 6)
        .text("1", 375, rowY + 6);

      doc
        .fillColor(C.darkHeader)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(`${currencyPrefix}${amount}.00`, 440, rowY + 6, { width: 105, align: "right" });

      // Table Row Divider
      const divY = rowY + 46;
      doc
        .moveTo(40, divY)
        .lineTo(555, divY)
        .strokeColor(C.borderColor)
        .lineWidth(1)
        .stroke();

      // ─── 6. FINANCIAL SUMMARY ───────────────────────────────────────────
      const summaryY = divY + 15;
      const sumX = 330;
      const sumW = 225;

      const addSummaryRow = (label, val, y, isBold = false) => {
        doc
          .fillColor(isBold ? C.darkHeader : C.textMuted)
          .fontSize(9.5)
          .font(isBold ? "Helvetica-Bold" : "Helvetica")
          .text(label, sumX, y)
          .text(val, sumX + 80, y, { width: sumW - 80, align: "right" });
      };

      addSummaryRow("Subtotal:", `${currencyPrefix}${amount}.00`, summaryY);
      addSummaryRow("Tax (0% GST):", `${currencyPrefix}0.00`, summaryY + 18);
      addSummaryRow("Discount:", `- ${currencyPrefix}0.00`, summaryY + 36);

      // Total Paid Highlight Box
      const totalBoxY = summaryY + 58;
      doc
        .roundedRect(sumX, totalBoxY, sumW, 36, 6)
        .fill(C.successAccent);

      doc
        .fillColor("#FFFFFF")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("TOTAL PAID:", sumX + 15, totalBoxY + 11)
        .fontSize(13)
        .text(`${currencyPrefix}${amount}.00`, sumX + 90, totalBoxY + 10, { width: sumW - 105, align: "right" });

      // ─── 7. FOOTER & TRUST BADGES ─────────────────────────────────────────
      const footerY = 700;

      // Divider Line
      doc
        .moveTo(40, footerY)
        .lineTo(555, footerY)
        .strokeColor(C.borderColor)
        .lineWidth(1)
        .stroke();

      // Trust & Security Notice
      doc
        .fillColor(C.textMuted)
        .fontSize(8)
        .font("Helvetica")
        .text(
          "This is an official computer-generated receipt and tax invoice issued by AI Expense Tracker Inc. No signature required.",
          40,
          footerY + 12,
          { align: "center", width: 515 }
        );

      doc
        .fillColor(C.primary)
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .text(
          "Need Help? Contact Support at support@aiexpensetracker.com  |  www.aiexpensetracker.com",
          40,
          footerY + 28,
          { align: "center", width: 515 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateInvoicePdfBuffer;
