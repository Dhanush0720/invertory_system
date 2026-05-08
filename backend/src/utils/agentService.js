const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// ── Guard: warn early if key is missing ──────────────────────────────────────
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY is not set. Gemini fallback will be unavailable.');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ── Shared model factory ──────────────────────────────────────────────────────
function getGeminiModel(json = true) {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: json ? { responseMimeType: 'application/json' } : {}
  });
}

// ── Retry helper for 429 Rate-Limit errors ────────────────────────────────────
async function withGeminiRetry(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = err?.status === 429;
      const retryDelay = parseInt(err?.errorDetails?.find(d => d.retryDelay)?.retryDelay) || 15;
      if (isRateLimit && attempt < maxRetries) {
        console.warn(`⏳ Gemini rate-limited. Retrying in ${retryDelay}s (attempt ${attempt}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, retryDelay * 1000));
      } else {
        throw err;
      }
    }
  }
}

// ── Ollama helper with timeout ────────────────────────────────────────────────
async function callOllama(prompt, format = 'json', timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama3.2', prompt, stream: false, ...(format ? { format } : {}) }),
      signal: controller.signal
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Strip LLM markdown artifacts ──────────────────────────────────────────────
function cleanJSON(raw) {
  return raw.replace(/```json/gi, '').replace(/```/g, '').trim();
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * generateInventoryInsights
 * Prioritizes local Ollama (llama3.2), falls back to Google Gemini.
 */
async function generateInventoryInsights(inventoryData) {
  const systemPrompt = `
You are Nirvahana, an autonomous Estate Management AI Assistant for a college.
Analyze the provided JSON data containing current low-stock items and recent distribution logs.

Your goals:
1. Identify items at critical risk of stockout (e.g. before exams or start of semesters).
2. Spot unusual distribution patterns or financial anomalies/theft (e.g. a department requesting mass quantities of expensive assets abruptly). Mark as 'Fraud Alert'.
3. Formulate a proactive, prioritized action plan.
4. Always use Indian Rupees (₹) for monetary values.

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

  // ── 1. Try Local Ollama (with 20s timeout) ────────────────────────────────
  try {
    console.log('⚡ Contacting Local Ollama (llama3.2)...');
    const ollamaRes = await callOllama(prompt, 'json', 20000);

    if (ollamaRes.ok) {
      const jsonResp = await ollamaRes.json();
      console.log('✅ Ollama responded successfully.');
      const parsed = JSON.parse(cleanJSON(jsonResp.response));
      if (parsed && Array.isArray(parsed.insights) && parsed.insights.length > 0) {
        return parsed;
      }
      console.log('⚠️  Ollama returned empty insights. Falling back to Gemini...');
    } else {
      console.log('⚠️  Ollama returned non-OK status. Falling back to Gemini...');
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('⏱️  Ollama timed out after 20s. Falling back to Gemini...');
    } else {
      console.log('⚠️  Ollama unreachable. Falling back to Gemini...');
    }
  }

  // ── 2. Fallback — Google Gemini (with retry on 429) ───────────────────────
  try {
    const result = await withGeminiRetry(() =>
      getGeminiModel(true).generateContent(prompt)
    );
    const parsed = JSON.parse(result.response.text());
    console.log('✅ Gemini generated insights successfully.');
    return parsed;
  } catch (err) {
    console.error('❌ Both Ollama and Gemini failed:', err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * parseInvoiceVision
 * Reads a receipt image and extracts item details via Gemini Vision.
 */
async function parseInvoiceVision(base64Image, mimeType) {
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
}`;

  const imagePart = { inlineData: { data: base64Image, mimeType } };

  try {
    const result = await withGeminiRetry(() =>
      getGeminiModel(true).generateContent([systemPrompt, imagePart])
    );
    const text = cleanJSON(result.response.text());
    return JSON.parse(text);
  } catch (e) {
    console.error('Vision AI Error:', e?.message || e);
    throw e;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * generateFinancialForecast
 * Generates a 30-day cost projection from recent distributions.
 */
async function generateFinancialForecast(distributionData) {
  const prompt = `You are Nirvahana, a college financial forecaster.
Analyze the following JSON of recent distributions.
Calculate the average daily cost and extrapolate to the next 30 days.

CRITICAL INSTRUCTION: Never show your mathematical work or chain of thought. Never start with "Greetings".
Your ENTIRE response MUST be exactly 1 or 2 concise, executive-ready sentences.
Start exactly with "Based on recent trends," and use the Indian Rupee (₹) symbol.

Distributions Data:
${JSON.stringify(distributionData)}`;

  try {
    const result = await withGeminiRetry(() =>
      getGeminiModel(false).generateContent(prompt)
    );
    return result.response.text().trim().replace(/\*\*/g, '');
  } catch (e) {
    console.error('Forecast AI Error:', e?.message || e);
    return 'Nirvahana is currently calibrating its forecast algorithms. Try again later.';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * askNirvahana
 * Natural language Q&A — tries Ollama first, falls back to Gemini.
 */
async function askNirvahana(question, inventorySnapshot) {
  const systemPrompt = `You are Nirvahana, an advanced autonomous AI managing the college inventory.
Answer the user's question clearly, professionally, and concisely based ONLY on the provided JSON inventory data.
Return plain text only — no markdown, no bullet symbols. Always use Indian Rupees (₹) and Indian numbering.`;
  const prompt = `${systemPrompt}\n\nInventory Snapshot:\n${JSON.stringify(inventorySnapshot)}\n\nUser Question: ${question}`;

  // Try Ollama first
  try {
    const res = await callOllama(prompt, '', 15000);
    if (res.ok) {
      const data = await res.json();
      if (data.response && data.response.trim().length > 0) {
        return { answer: data.response.trim(), source: 'ollama' };
      }
    }
  } catch (_) {
    // fall through
  }

  // Gemini fallback
  try {
    const result = await withGeminiRetry(() =>
      getGeminiModel(false).generateContent(prompt)
    );
    return { answer: result.response.text().trim(), source: 'gemini' };
  } catch (e) {
    console.error('Ask Nirvahana Gemini Error:', e?.message || e);
    throw new Error('Nirvahana AI is temporarily unavailable. Please try again shortly.');
  }
}

module.exports = { generateInventoryInsights, parseInvoiceVision, generateFinancialForecast, askNirvahana };