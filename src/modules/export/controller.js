const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const Transaction = require("../transaction/model");
const jwt = require("jsonwebtoken");
const dayjs = require("dayjs");

// ─── THEME ────────────────────────────────────────────────────────────────
const COLORS = {
  primary: "4B8CFF",
  income: "00C48C",
  expense: "FF647C",
  textMuted: "888888",
  textBody: "333333",
  border: "DDE3EE",
  rowAlt: "F9FAFC",
  boxBg: "F4F6FB",
};

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

// ─── EXCEL EXPORT (ExcelJS — actually styleable) ───────────────────────────
const buildXlsx = async (transactions, res) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AI Expense Tracker";
  wb.created = new Date();

  const ws = wb.addWorksheet("Transactions", {
    views: [{ state: "frozen", ySplit: 1 }], // freeze header row
  });

  ws.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Description", key: "description", width: 30 },
    { header: "Category", key: "category", width: 18 },
    { header: "Type", key: "type", width: 12 },
    { header: "Payment Method", key: "paymentMethod", width: 18 },
    { header: "Amount (₹)", key: "amount", width: 14 },
    { header: "Note", key: "note", width: 28 },
  ];

  // Header row styling
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${COLORS.primary}` },
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });
  headerRow.height = 22;

  // Data rows
  transactions.forEach((t, idx) => {
    const isIncome = t.type === "income";
    const row = ws.addRow({
      date: dayjs(t.transactionDate).format("DD MMM YYYY"),
      description: t.description || "",
      category: t.category || "",
      type: isIncome ? "Income" : "Expense",
      paymentMethod: t.paymentMethod || "",
      amount: isIncome ? t.amount : -t.amount,
      note: t.note || "",
    });

    row.getCell("amount").numFmt = '"₹"#,##0.00;[Red]-"₹"#,##0.00';
    row.getCell("type").font = {
      color: { argb: isIncome ? `FF${COLORS.income}` : `FF${COLORS.expense}` },
      bold: true,
    };

    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: `FF${COLORS.rowAlt}` },
        };
      });
    }
  });

  // Thin borders on the whole table
  ws.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: "thin", color: { argb: `FF${COLORS.border}` } },
      };
    });
  });

  const fileName = `transactions_${dayjs().format("YYYY-MM-DD")}.xlsx`;
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  await wb.xlsx.write(res);
  res.end();
};

// ─── PDF EXPORT ─────────────────────────────────────────────────────────
const TABLE_COLS = [
  { key: "date", label: "Date", x: 40, width: 65 },
  { key: "description", label: "Description", x: 105, width: 115 },
  { key: "category", label: "Category", x: 220, width: 80 },
  { key: "paymentMethod", label: "Payment", x: 300, width: 80 },
  { key: "type", label: "Type", x: 380, width: 60 },
  { key: "amount", label: "Amount", x: 440, width: 115 },
];
const TABLE_LEFT = 40;
const TABLE_RIGHT = 555;
const PAGE_BOTTOM = 760;

const drawTableHeader = (doc, y) => {
  doc.fontSize(9).font("Helvetica-Bold").fillColor(COLORS.textMuted);
  TABLE_COLS.forEach((c) => doc.text(c.label, c.x, y, { width: c.width }));
  doc
    .moveTo(TABLE_LEFT, y + 14)
    .lineTo(TABLE_RIGHT, y + 14)
    .strokeColor(`#${COLORS.border}`)
    .stroke();
  doc.font("Helvetica");
  return y + 20;
};

const drawFooter = (doc, pageNumber) => {
  doc
    .fontSize(8)
    .fillColor(`#${COLORS.textMuted}`)
    .text(
      `AI Expense Tracker · Generated ${dayjs().format("DD MMM YYYY, hh:mm A")}`,
      TABLE_LEFT,
      810,
      { width: 300 }
    )
    .text(`Page ${pageNumber}`, TABLE_RIGHT - 60, 810, { width: 60, align: "right" });
};

const buildPdf = (transactions, res) => {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const savings = totalIncome - totalExpense;

  const fileName = `transactions_${dayjs().format("YYYY-MM-DD")}.pdf`;
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Content-Type", "application/pdf");

  const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
  doc.pipe(res);

  // Header
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor(`#${COLORS.primary}`)
    .text("AI Expense Tracker", { align: "center" });
  doc
    .fontSize(11)
    .font("Helvetica")
    .fillColor(`#${COLORS.textMuted}`)
    .text(`Transaction Report — ${dayjs().format("DD MMMM YYYY")}`, { align: "center" });
  doc.moveDown();

  // Summary box
  const boxTop = doc.y;
  doc.roundedRect(40, boxTop, 515, 70, 6).fillAndStroke(`#${COLORS.boxBg}`, `#${COLORS.border}`);
  const boxY = boxTop + 14;

  const summaryCell = (label, value, color, x) => {
    doc.fontSize(10).font("Helvetica").fillColor(`#${COLORS.textMuted}`).text(label, x, boxY);
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor(color)
      .text(`₹${Math.abs(value).toLocaleString("en-IN")}`, x, boxY + 14);
  };
  summaryCell("TOTAL INCOME", totalIncome, `#${COLORS.income}`, 60);
  summaryCell("TOTAL EXPENSE", totalExpense, `#${COLORS.expense}`, 230);
  summaryCell(
    savings >= 0 ? "NET SAVINGS" : "NET DEFICIT",
    savings,
    savings >= 0 ? `#${COLORS.primary}` : `#${COLORS.expense}`,
    400
  );

  doc.y = boxTop + 90;
  doc.font("Helvetica");

  if (transactions.length === 0) {
    doc
      .fontSize(11)
      .fillColor(`#${COLORS.textMuted}`)
      .text("No transactions to display for this period.", { align: "center" });
    doc.end();
    return;
  }

  // Table
  let rowY = drawTableHeader(doc, doc.y);

  transactions.forEach((t) => {
    if (rowY > PAGE_BOTTOM) {
      doc.addPage();
      rowY = drawTableHeader(doc, 40);
    }

    const isIncome = t.type === "income";
    doc.fontSize(8).fillColor(`#${COLORS.textBody}`);
    doc.text(dayjs(t.transactionDate).format("DD MMM YY"), TABLE_COLS[0].x, rowY, {
      width: TABLE_COLS[0].width,
    });
    doc.text(t.description || "-", TABLE_COLS[1].x, rowY, {
      width: TABLE_COLS[1].width,
      ellipsis: true,
    });
    doc.text(t.category || "-", TABLE_COLS[2].x, rowY, {
      width: TABLE_COLS[2].width,
      ellipsis: true,
    });
    doc.text(t.paymentMethod || "-", TABLE_COLS[3].x, rowY, {
      width: TABLE_COLS[3].width,
      ellipsis: true,
    });
    doc
      .fillColor(isIncome ? `#${COLORS.income}` : `#${COLORS.expense}`)
      .text(isIncome ? "Income" : "Expense", TABLE_COLS[4].x, rowY, {
        width: TABLE_COLS[4].width,
      })
      .text(
        `${isIncome ? "+" : "-"}₹${t.amount.toLocaleString("en-IN")}`,
        TABLE_COLS[5].x,
        rowY,
        { width: TABLE_COLS[5].width, align: "right" }
      );

    rowY += 18;
  });

  // Footer + page numbers on every page
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    drawFooter(doc, i + 1);
  }

  doc.end();
};

// ─── ROUTE HANDLER ─────────────────────────────────────────────────────────
// GET /api/export?format=xlsx|pdf&token=<jwt>
const exportTransactions = async (req, res) => {
  try {
    const { format = "xlsx" } = req.query;
    const userId = req.user.userId;

    const transactions = await Transaction.find({ user: userId }).sort({
      transactionDate: -1,
    });

    if (format === "xlsx") return buildXlsx(transactions, res);
    if (format === "pdf") return buildPdf(transactions, res);

    return res.status(400).json({ success: false, message: "Invalid format. Use xlsx or pdf." });
  } catch (error) {
    console.error("Export error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { exportTransactions, authenticateQuery };