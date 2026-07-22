const invoiceTemplate = ({
  userName,
  userEmail,
  planName,
  amount,
  currency = 'INR',
  orderId,
  paymentId,
  paidAt,
  startDate,
  endDate,
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt & Invoice</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #090A0F;
      color: #E2E8F0;
      margin: 0;
      padding: 20px;
    }
    .invoice-card {
      max-width: 600px;
      margin: 0 auto;
      background-color: #12131A;
      border: 1px solid #1F222F;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .header {
      background: linear-gradient(135deg, #8A3FFC 0%, #5E1BDB 100%);
      padding: 30px 25px;
      color: #FFFFFF;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-title {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .brand-subtitle {
      margin: 4px 0 0 0;
      font-size: 12px;
      opacity: 0.85;
    }
    .paid-badge {
      background-color: #00D26A;
      color: #090A0F;
      font-weight: 800;
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .body-content {
      padding: 25px;
    }
    .invoice-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 25px;
      background-color: #181A24;
      padding: 15px 20px;
      border-radius: 8px;
      border: 1px solid #1A1C26;
    }
    .info-item {
      font-size: 13px;
    }
    .info-label {
      color: #8E949A;
      margin-bottom: 4px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      color: #FFFFFF;
      font-weight: 600;
      word-break: break-all;
    }
    .table-container {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    .table-container th {
      background-color: #181A24;
      color: #8E949A;
      text-align: left;
      padding: 12px 15px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #1F222F;
    }
    .table-container td {
      padding: 15px;
      border-bottom: 1px solid #1F222F;
      font-size: 14px;
    }
    .amount-col {
      text-align: right;
      font-weight: 700;
    }
    .total-box {
      background-color: #181A24;
      padding: 20px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      border: 1px solid #8A3FFC;
    }
    .total-label {
      font-size: 16px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .total-amount {
      font-size: 24px;
      font-weight: 800;
      color: #00D26A;
    }
    .features-card {
      background-color: rgba(138, 63, 252, 0.08);
      border: 1px solid rgba(138, 63, 252, 0.2);
      border-radius: 8px;
      padding: 15px 20px;
      margin-bottom: 25px;
    }
    .features-title {
      margin: 0 0 10px 0;
      font-size: 13px;
      color: #A366FF;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .features-list {
      margin: 0;
      padding-left: 18px;
      color: #CBD5E1;
      font-size: 13px;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      padding: 20px 25px;
      border-top: 1px solid #1F222F;
      font-size: 12px;
      color: #64748B;
    }
    .footer a {
      color: #8A3FFC;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Header -->
    <div class="header">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td>
            <h1 class="brand-title">AI EXPENSE TRACKER</h1>
            <p class="brand-subtitle">Official Payment Receipt & Tax Invoice</p>
          </td>
          <td align="right">
            <span class="paid-badge">PAID</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body -->
    <div class="body-content">
      <p style="font-size: 15px; color: #FFFFFF; margin-top: 0;">Hi <strong>${userName}</strong>,</p>
      <p style="font-size: 13px; color: #94A3B8; margin-bottom: 20px;">
        Thank you for upgrading! Your subscription payment was processed successfully. Here are the official invoice details for your transaction:
      </p>

      <!-- Grid Metadata -->
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; background-color: #181A24; border-radius: 8px; padding: 15px;">
        <tr>
          <td width="50%" style="padding: 6px 10px; vertical-align: top;">
            <div class="info-label">Billed To</div>
            <div class="info-value">${userName}</div>
            <div style="font-size: 12px; color: #94A3B8;">${userEmail}</div>
          </td>
          <td width="50%" style="padding: 6px 10px; vertical-align: top;">
            <div class="info-label">Payment Date</div>
            <div class="info-value">${paidAt}</div>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding: 6px 10px; vertical-align: top;">
            <div class="info-label">Order ID</div>
            <div class="info-value">${orderId}</div>
          </td>
          <td width="50%" style="padding: 6px 10px; vertical-align: top;">
            <div class="info-label">Payment ID</div>
            <div class="info-value">${paymentId}</div>
          </td>
        </tr>
      </table>

      <!-- Itemized Table -->
      <table class="table-container">
        <thead>
          <tr>
            <th>Item / Description</th>
            <th>Validity Period</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong style="color: #FFFFFF;">${planName}</strong>
              <div style="font-size: 11px; color: #64748B;">Includes all AI features & Cloud Sync</div>
            </td>
            <td style="color: #94A3B8; font-size: 12px;">
              ${startDate} &rarr; ${endDate}
            </td>
            <td class="amount-col" style="color: #FFFFFF;">
              ₹${amount}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Total Box -->
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #181A24; border: 1px solid #8A3FFC; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <tr>
          <td style="font-size: 15px; font-weight: 700; color: #FFFFFF;">Total Paid (Taxes Included)</td>
          <td align="right" style="font-size: 24px; font-weight: 800; color: #00D26A;">₹${amount} ${currency}</td>
        </tr>
      </table>

      <!-- Benefits Summary -->
      <div class="features-card">
        <div class="features-title">✨ Unlocked Premium Features</div>
        <ul class="features-list">
          <li><strong>AI Chat Assistant:</strong> Unlimited financial insights & queries</li>
          <li><strong>AI Receipt Scanner:</strong> High-precision OCR bill scanning</li>
          <li><strong>Voice Logging:</strong> Hands-free natural speech transaction entry</li>
          <li><strong>MongoDB Cloud Sync:</strong> Real-time encrypted backup & multi-device access</li>
        </ul>
      </div>

    </div>

    <!-- Footer -->
    <div class="footer">
      If you have questions regarding this receipt, please contact support at <a href="mailto:${process.env.EMAIL_USER || 'support@aiexpensetracker.com'}">${process.env.EMAIL_USER || 'support@aiexpensetracker.com'}</a>.
      <br><br>
      &copy; ${new Date().getFullYear()} AI Expense Tracker. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

module.exports = invoiceTemplate;
