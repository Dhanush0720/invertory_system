const { GoogleGenerativeAI } = require('@google/generative-ai');

require('dotenv').config();
const genAI = new GoogleGenerativeAI("AIzaSyAaJvGWEB0pMqNuhlZ0ko4aBYhLoy8B8aw");

/**
 * Passes daily inventory data to the LLM to generate autonomous insights.
 * Prioritizes local Ollama (llama3.2), falls back to Google Gemini.
 */
async function generateInventoryInsights(inventoryData) {
    const systemPrompt = `
You are an autonomous Estate Management AI Assistant for a college. 
Analyze the provided JSON data containing current low-stock items and recent distribution logs.

Your goals:
1. Identify any items at critical risk of stockout contextually (e.g. before exams or start of semesters).
2. Spot any unusual distribution patterns or financial anomalies/theft (e.g. a single department abruptly requesting expensive assets or mass quantities out of nowhere). Mark this as a 'Fraud Alert'.
3. Formulate a proactive, prioritized action plan.
4. IMPORTANT: Always use Indian Rupees (₹) formatting for any monetary or financial references. Do not use Dollars ($).

Output ONLY a valid JSON object (no markdown, no backticks) with this exact structure:
{
    "insights": [
        {
            "severity": "High|Medium|Low",
            "issue_type": "Stockout Risk|Anomaly Detection",
            "message": "Clear, 1-sentence description.",
            "recommended_action": "What to do.",
            "action_code": "AUTO_ORDER|FLAG_FOR_REVIEW|REALLOCATE"
        }
    ]
}
`;
    const prompt = `${systemPrompt}\n\nHere is today's data:\n${JSON.stringify(inventoryData, null, 2)}`;

    // 1. Try Local Ollama First
    try {
        console.log("⚡ Contacting Local Ollama (llama3.2)...");
        const ollamaRes = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.2',
                prompt: prompt,
                stream: false,
                format: 'json'
            })
        });

        if (ollamaRes.ok) {
            const jsonResp = await ollamaRes.json();
            let rawOutput = jsonResp.response;
            console.log("✅ Ollama Responded Successfully.");
            
            // Sanitization layer to strip " ```json " markers
            rawOutput = rawOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
            
            return JSON.parse(rawOutput);
        }
        console.log("⚠️ Ollama returned non-OK status, falling back to Gemini...");
    } catch (error) {
        console.log("⚠️ Local Ollama unreachable or connection refused. Falling back to Google Gemini...");
    }

    // 2. Fallback to Google Gemini
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (geminiError) {
        console.error("❌ Both Ollama and Gemini Autonomous Agent generations failed:", geminiError);
        return null;
    }
}

async function parseInvoiceVision(base64Image, mimeType) {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        
        const systemPrompt = `You are Nirvahana, checking an invoice. 
Extract the primary line item from the provided bill/invoice.
Return perfectly pure JSON with NO markdown tags.

JSON schema:
{
  "itemName": "String (the main product)",
  "company": "String (brand of product, or empty)",
  "billNo": "String (invoice/receipt number)",
  "quantityPurchased": Number,
  "unitPrice": Number,
  "shopName": "String (Name of the store/vendor)"
}
`;
        
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType
            }
        };

        const result = await model.generateContent([systemPrompt, imagePart]);
        const text = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (e) {
        console.error("Vision AI Error:", e);
        throw e;
    }
}

async function generateFinancialForecast(distributionData) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `You are Nirvahana, a college financial forecaster.
Analyze the following JSON of recent distributions.
Calculate the average daily cost and extrapolate to the next 30 days.

CRITICAL INSTRUCTION: You MUST NEVER show your mathematical work or chain of thought. You MUST NEVER introduce yourself with "Greetings".
Your ENTIRE response MUST ONLY be exactly 1 or 2 concise, executive-ready sentences summarizing the cost and the projected 30-day budget requirement.
It MUST start exactly with "Based on recent trends," and you must use the Indian Rupee (₹) symbol.

Distributions Data:
${JSON.stringify(distributionData)}`;
        const result = await model.generateContent(prompt);
        return result.response.text().trim().replace(/\*\*/g, ''); // strip any bold asterisks
    } catch (e) {
        console.error("Forecast AI Error:", e);
        return "Nirvahana is currently calibrating its forecast algorithms. Try again later.";
    }
}

module.exports = { generateInventoryInsights, parseInvoiceVision, generateFinancialForecast };