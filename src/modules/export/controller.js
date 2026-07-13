const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");
const Transaction = require("../transaction/model");
const jwt = require("jsonwebtoken");
const dayjs = require("dayjs");

// Middleware: authenticate via query token (for browser download links)
const authenticateQuery = (req, res, next) => {
  try {
    const token =
      (req.headers.authorization || "").split(" ")[1] || req.query.token;
    if (!token) return res.status(401).json({ success: false, message: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// GET /api/export?format=xlsx|pdf&token=<jwt>
const exportTransactions = async (req, res) => {
  try {
    const { format = "xlsx" } = req.query;
    const userId = req.user.userId;

    const transactions = await Transaction.find({ user: userId }).sort({
      transactionDate: -1,
    });

    if (format === "xlsx") {
      // ─── Excel ───────────────────────────────────────────────────────────
      const rows = transactions.map((t) => ({
        Date: dayjs(t.transactionDate).format("DD MMM YYYY"),
        Description: t.description || "",
        Category: t.category || "",
        Type: t.type === "income" ? "Income" : "Expense",
        "Payment Method": t.paymentMethod || "",
        Amount:
          t.type === "income" ? `+${t.amount}` : `-${t.amount}`,
        Note: t.note || "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      // Auto column widths
      const colKeys = Object.keys(rows[0] || {});
      ws["!cols"] = colKeys.map((key) => ({
        wch:
          Math.max(
            key.length,
            ...rows.map((r) => String(r[key] ?? "").length)
          ) + 2,
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const fileName = `transactions_${dayjs().format("YYYY-MM-DD")}.xlsx`;
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      return res.send(buffer);
    }

    if (format === "pdf") {
      // ─── PDF ─────────────────────────────────────────────────────────────
      const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const totalExpense = transactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
      const savings = Math.max(totalIncome - totalExpense, 0);

      const fileName = `transactions_${dayjs().format("YYYY-MM-DD")}.pdf`;
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Type", "application/pdf");

      const doc = new PDFDocument({ margin: 40, size: "A4" });
      doc.pipe(res);

      // Header
      doc
        .fontSize(20)
        .fillColor("#4B8CFF")
        .text("AI Expense Tracker", { align: "center" });
      doc
        .fontSize(11)
        .fillColor("#888")
        .text(`Transaction Report — ${dayjs().format("DD MMMM YYYY")}`, {
          align: "center",
        });
      doc.moveDown();

      // Summary box
      doc.roundedRect(40, doc.y, 515, 70, 6).fillAndStroke("#F4F6FB", "#DDE3EE");
      const boxY = doc.y - 70 + 14;
      doc.fontSize(10).fillColor("#555").text("TOTAL INCOME", 60, boxY);
      doc
        .fontSize(16)
        .fillColor("#00C48C")
        .text(`₹${totalIncome.toLocaleString()}`, 60, boxY + 14);

      doc.fontSize(10).fillColor("#555").text("TOTAL EXPENSE", 230, boxY);
      doc
        .fontSize(16)
        .fillColor("#FF647C")
        .text(`₹${totalExpense.toLocaleString()}`, 230, boxY + 14);

      doc.fontSize(10).fillColor("#555").text("NET SAVINGS", 400, boxY);
      doc
        .fontSize(16)
        .fillColor("#4B8CFF")
        .text(`₹${savings.toLocaleString()}`, 400, boxY + 14);

      doc.moveDown(2);

      // Table header
      const tableTop = doc.y;
      const colX = [40, 120, 230, 310, 390, 460];
      const headers = ["Date", "Description", "Category", "Payment", "Type", "Amount"];

      doc.fontSize(9).fillColor("#555");
      headers.forEach((h, i) => doc.text(h, colX[i], tableTop, { width: 75 }));
      doc
        .moveTo(40, tableTop + 14)
        .lineTo(555, tableTop + 14)
        .strokeColor("#DDE3EE")
        .stroke();

      // Table rows
      let rowY = tableTop + 20;
      transactions.forEach((t, idx) => {
        if (rowY > 750) {
          doc.addPage();
          rowY = 40;
        }

        if (idx % 2 === 0) {
          doc
            .rect(40, rowY - 3, 515, 16)
            .fillColor("#F9FAFC")
            .fill();
        }

        const isIncome = t.type === "income";
        doc.fontSize(8).fillColor("#333");
        doc.text(dayjs(t.transactionDate).format("DD MMM YY"), colX[0], rowY, { width: 75 });
        doc.text((t.description || "").substring(0, 14), colX[1], rowY, { width: 105 });
        doc.text((t.category || "").substring(0, 12), colX[2], rowY, { width: 75 });
        doc.text((t.paymentMethod || "-").substring(0, 10), colX[3], rowY, { width: 75 });
        doc.fillColor(isIncome ? "#00C48C" : "#FF647C");
        doc.text(isIncome ? "Income" : "Expense", colX[4], rowY, { width: 65 });
        doc.text(
          `${isIncome ? "+" : "-"}₹${t.amount.toLocaleString()}`,
          colX[5],
          rowY,
          { width: 80 }
        );

        rowY += 16;
      });

      // Footer
      doc
        .moveTo(40, rowY + 6)
        .lineTo(555, rowY + 6)
        .strokeColor("#DDE3EE")
        .stroke();
      doc
        .fontSize(8)
        .fillColor("#aaa")
        .text(
          `Generated on ${dayjs().format("DD MMMM YYYY, hh:mm A")} · AI Expense Tracker`,
          40,
          rowY + 12,
          { align: "center" }
        );

      doc.end();
      return;
    }

    return res.status(400).json({ success: false, message: "Invalid format. Use xlsx or pdf." });
  } catch (error) {
    console.error("Export error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { exportTransactions, authenticateQuery };
