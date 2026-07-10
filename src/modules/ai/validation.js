const RECEIPT_PROMPT = `
You are an expert receipt parser.

Analyze the receipt image and extract the following information.

Return ONLY valid JSON.

{
  "merchant": "",
  "amount": 0,
  "category": "",
  "transactionDate": "",
  "paymentMethod": "",
  "items": [
    {
      "name": "",
      "price": 0
    }
  ]
}

Rules:
- Do not return markdown.
- Do not use \`\`\`json.
- Do not explain anything.
- If any value is missing, return null.
- Amount should be the total bill amount.
- Category should be one of:
  Food, Grocery, Shopping, Fuel, Travel, Entertainment, Medical, Bills, Education, Other.
`;

module.exports = RECEIPT_PROMPT;