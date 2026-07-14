require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function test(modelName) {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Hello, tell me a 1-word joke.",
    });
    console.log(`Success with ${modelName}! Response:`, response.text);
    return true;
  } catch (error) {
    console.error(`Error with ${modelName}:`, error.message);
    return false;
  }
}

async function run() {
  await test("gemini-flash-latest");
  await test("gemini-2.0-flash-lite");
  await test("gemini-3.1-flash-lite");
}

run();
