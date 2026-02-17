const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const { authenticateToken } = require('../../middleware/auth');
const { logAction } = require('../../utils/audit');

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', authenticateToken, upload.single('invoiceFile'), async (req, res) => {
    try {
        console.log("--- Scan Request Start ---");
        console.log("CWD:", process.cwd());
        console.log("File present:", !!req.file);
        if (req.file) console.log("File size:", req.file.size, "Mime:", req.file.mimetype);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("CRITICAL: GEMINI_API_KEY is missing in process.env");
            return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
        }

        console.log("API Key found (length):", apiKey.length);
        // Check for common issues like quotes
        if (apiKey.startsWith('"') || apiKey.startsWith("'")) {
            console.warn("WARNING: API Key seems to be quoted. This might cause issues.");
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Convert buffer to base64 for Gemini
        const filePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype,
            },
        };

        // Prompt for Gemini
        const prompt = `
            You are an expert invoice data extractor. 
            Analyze the attached invoice image / PDF and extract the following fields into a pure JSON object.
            Do not include markdown formatting(like \`\`\`json). Return ONLY the raw JSON string.
            
            Fields to extract:
            - numero: Invoice number (string)
            - fecha_emision: Issue date in YYYY-MM-DD format (string)
            - emisor_nombre: Issuer name (string)
            - emisor_nif: Issuer Tax ID/NIF (string)
            - emisor_direccion: Issuer address (string)
            - receptor_nombre: Receiver name (string)
            - receptor_nif: Receiver Tax ID/NIF (string)
            - receptor_direccion: Receiver address (string)
            - subtotal: Subtotal amount before tax (number)
            - impuestos_totales: Total tax amount (number)
            - total: Total invoice amount (number)
            - lineas: Array of line items, each containing:
                - descripcion: Description (string)
                - cantidad: Quantity (number, default 1)
                - precio_unitario: Unit price (number)
                - porcentaje_impuesto: Tax percentage (number, e.g., 21)
                - total_linea: Total line amount (number)

            If a field is not found, use null or an empty string/0 as appropriate.
            Ensure all numbers are parsed as numbers, not strings.
        `;

        console.log("Sending request to Gemini...");
        // Use a model confirmed to be available in the list
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent([prompt, filePart]);
        console.log("Gemini response received");
        const response = await result.response;
        let text = response.text();

        // Clean up markdown if present (just in case)
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        console.log("Gemini Raw Response (First 100 chars):", text.substring(0, 100));

        let jsonData;
        try {
            jsonData = JSON.parse(text);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            console.error("Raw Text was:", text);
            return res.status(500).json({ error: 'Failed to parse Gemini response', raw: text });
        }

        // Log scan action
        logAction(req.user.id, 'SCAN_INVOICE', 'SCAN', null, { filename: req.file.originalname }, req.ip);

        res.json(jsonData);

    } catch (error) {
        console.error("Error processing scan (Catch Block):", error);
        res.status(500).json({ error: 'Failed to process invoice', details: error.message });
    }
});

module.exports = router;
