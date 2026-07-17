const ai = require("../../config/gemini");
const RECEIPT_PROMPT = require("./prompt");

const scanReceipt = async (base64Data, mimeType = "image/jpeg", textData = null) => {
  try {
    console.log(`[Gemini] Starting scan — mimeType: ${mimeType}, base64 length: ${base64Data ? base64Data.length : 0}, hasTextData: ${!!textData}`);

    const parts = [
      {
        text: RECEIPT_PROMPT,
      }
    ];

    if (textData) {
      // Spreadsheet/CSV: send extracted text directly in the prompt
      console.log(`[Gemini] Using text path — textData length: ${textData.length}`);
      parts.push({
        text: "Here is the raw text content extracted from the spreadsheet/document file. Please parse and extract the receipt fields:\n\n" + textData
      });
    } else {
      // Image or PDF: send as inlineData (supported for images + PDFs by gemini-2.5-flash)
      console.log(`[Gemini] Using inlineData path — mimeType: ${mimeType}`);
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        }
      });
    }

    console.log(`[Gemini] Sending request to gemini-flash-latest with ${parts.length} parts`);

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],
    });

    const rawText = response.text;
    console.log(`[Gemini] Raw response length: ${rawText ? rawText.length : 0}`);
    console.log(`[Gemini] Raw response preview: ${rawText ? rawText.substring(0, 300) : '(empty)'}`);

    if (!rawText || rawText.trim().length === 0) {
      throw new Error("Gemini returned an empty response. The file may be unreadable or unsupported.");
    }

    // Strip markdown code fences if Gemini wraps the JSON anyway
    let text = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsedData = JSON.parse(text);
    console.log(`[Gemini] Successfully parsed response — merchant: ${parsedData.merchant}, amount: ${parsedData.amount}`);
    return parsedData;
  } catch (error) {
    console.error(`[Gemini] Error scanning receipt:`, error.message);
    throw error;
  }
};

module.exports = {
  scanReceipt,
};