const welcomeTemplate = (userName) => `
<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #8A3FFC;">
    <h1 style="color: #8A3FFC; margin: 0;">AI Expense Tracker</h1>
    <p style="color: #666; margin-top: 5px;">Smart Personal Finance & Expense Management</p>
  </div>
  
  <div style="padding: 20px 0;">
    <h2 style="color: #333;">Welcome to the family, ${userName}! 🎉</h2>
    <p style="color: #555; line-height: 1.6;">
      Thank you for joining AI Expense Tracker. You are now equipped with smart tools to track expenses, log voice transactions, scan receipt invoices, and master your financial goals!
    </p>
    
    <div style="background-color: #f8f5ff; border-left: 4px solid #8A3FFC; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #8A3FFC;">Quick Getting Started Tips:</h3>
      <ul style="color: #555; padding-left: 20px; margin-bottom: 0;">
        <li><strong>Log Transactions:</strong> Manually or use our Floating Voice Logger</li>
        <li><strong>Scan Receipts:</strong> Upload paper bills or PDF invoices</li>
        <li><strong>Set Category Budgets:</strong> Track category-wise limits with real-time alerts</li>
        <li><strong>FinMate Chatbot:</strong> Ask questions about your personal budget anytime</li>
      </ul>
    </div>
    
    <p style="color: #555; line-height: 1.6;">
      If you ever need assistance, feel free to use the Help & Support feature inside the app.
    </p>
  </div>
  
  <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
    &copy; ${new Date().getFullYear()} AI Expense Tracker. All rights reserved.
  </div>
</div>
`;

module.exports = welcomeTemplate;
