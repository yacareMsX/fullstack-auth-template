require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    try {
        console.log("Testing Gemini (flash-latest)...");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Trying gemini-flash-latest which acts as an alias to the current stable flash model
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = "Explain SAP IDoc in 5 words.";
        console.log("Prompting:", prompt);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("SUCCESS. Response:", text);
    } catch (error) {
        console.error("FAILURE. Error:", error.message);
    }
}

testGemini();
