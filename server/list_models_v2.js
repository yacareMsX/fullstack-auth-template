const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        // Accessing the model listing via the simpler API if possible, or using REST as backup if SDK doesn't expose it easily.
        // NOTE: The Node SDK doesn't have a direct 'listModels' helper exposed on the clean instance usually, 
        // but we can try to assume the user might have access or we can just try a few known ones.

        // Actually, let's use the REST API approach for listing to be sure, using fetch.
        // But we need the API key.

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("No API Key found in env.");
            return;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                console.log(`- ${m.name} (${m.displayName})`);
                console.log(`  Supported methods: ${m.supportedGenerationMethods}`);
            });
        } else {
            console.log("No models returned or error:", data);
        }

    } catch (err) {
        console.error("Error listing models:", err);
    }
}

listModels();
