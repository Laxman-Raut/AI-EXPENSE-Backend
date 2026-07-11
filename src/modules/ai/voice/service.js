const ai = require("../../../config/gemini");
const VOICE_PROMPT = require("./prompt");

const parseVoiceTransaction = async (text) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${VOICE_PROMPT}

User Speech:
"${text}"
`,
            },
          ],
        },
      ],
    });

    let result = response.text;

    result = result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(result);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  parseVoiceTransaction,
};