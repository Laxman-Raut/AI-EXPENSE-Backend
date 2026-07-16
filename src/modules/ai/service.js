const ai = require("../../config/gemini");
const RECEIPT_PROMPT = require("./prompt");

const scanReceipt = async (base64Data, mimeType = "image/jpeg", textData = null) => {
  try {
    const parts = [
      {
        text: RECEIPT_PROMPT,
      }
    ];

    if (textData) {
      parts.push({
        text: "Here is the raw text content extracted from the spreadsheet/document file. Please parse and extract the receipt fields:\n\n" + textData
      });
    } else {
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],
    });

    let text = response.text;

    // Remove markdown if Gemini returns it
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedData = JSON.parse(text);
    return parsedData;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  scanReceipt,
};