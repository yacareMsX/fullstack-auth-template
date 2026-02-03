const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

router.post('/mapping-recommendation', async (req, res) => {
    const { fieldName, fieldType, description } = req.body;

    if (!fieldName) {
        return res.status(400).json({ error: 'Field name is required' });
    }

    try {
        const prompt = `
            Act as an SAP Integration Expert.
            I have an XML/XSD field that needs to be mapped to an SAP Idoc or Structure field.
            
            Field Name: ${fieldName}
            Field Type: ${fieldType || 'Unknown'}
            Description: ${description || 'No description provided'}
            User Custom Query: ${req.body.userQuery || 'None'}
            
            Recommend a suitable SAP Structure/Field or a standard fixed value.
            If the user asked a specific question, answer it.
            If you are not sure, suggest a close match or "Revisar Manualmente".
            Provide a short reasoning.
            
            Response Format (JSON only):
            {
                "recommendation": "Suggested_SAP_Field_Or_Value",
                "reasoning": "Short explanation"
            }
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        console.log("Raw AI Response:", text); // Debug log
        console.log("Cleaned JSON:", jsonStr); // Debug log

        try {
            const jsonResponse = JSON.parse(jsonStr);
            res.json(jsonResponse);
        } catch (parseError) {
            console.error("Error parsing AI response:", text);
            console.error("Parse Error:", parseError);
            // Fallback if not valid JSON
            res.json({
                recommendation: null,
                reasoning: "Error parsing AI response. Raw: " + text
            });
        }

    } catch (error) {
        console.error('Error generating AI recommendation:', error);
        // Return the actual error message to the client for better debugging
        res.status(500).json({ error: error.message || 'AI Service User unavailable' });
    }
});

module.exports = router;
