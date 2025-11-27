const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("No API Key found in .env");
            return;
        }
        console.log("Using API Key:", apiKey.substring(0, 5) + "...");

        const genAI = new GoogleGenerativeAI(apiKey);
        // Note: listModels is not directly on genAI instance in some versions, 
        // but let's try the model manager if available or just try to instantiate a model and see.
        // Actually, the SDK doesn't have a simple listModels helper exposed on the main class easily in all versions.
        // Let's try a direct fetch to the REST API to be sure, or use a known stable model like 'gemini-pro'.

        // Let's try 'gemini-1.5-flash' again, but maybe the issue is the library version.
        // Let's try to use 'gemini-pro' which is usually available.

        console.log("Testing model: gemini-1.5-flash");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Model initialized. (This doesn't verify existence yet)");

    } catch (error) {
        console.error("Error:", error);
    }
}

// Since the SDK might not have listModels easily accessible, let's just try to use 'gemini-pro' in the main code
// as a fallback if the listing is hard. 
// But wait, the error message suggested calling ListModels.
// Let's try to hit the API endpoint directly with fetch.

const https = require('https');

function listModelsRaw() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.models) {
                    console.log("Available Models:");
                    json.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`));
                } else {
                    console.log("Response:", json);
                }
            } catch (e) {
                console.error("Error parsing response:", e);
                console.log("Raw:", data);
            }
        });
    }).on('error', (err) => {
        console.error("Error fetching models:", err);
    });
}

listModelsRaw();
