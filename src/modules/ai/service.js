const ai = require("../../config/gemini");
const RECEIPT_PROMPT = require("./prompt");

const scanReceipt = async (base64Data, mimeType = "image/jpeg") => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: RECEIPT_PROMPT,
            },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
          ],
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