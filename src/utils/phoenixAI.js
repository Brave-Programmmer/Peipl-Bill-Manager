/**
 * Get the fetch function - uses native fetch if available (Node 18+)
 */
function getFetchFunction() {
  if (typeof globalThis !== "undefined" && globalThis.fetch) {
    return globalThis.fetch;
  }
  // For server-side in older Node.js versions, use native fetch if available
  if (typeof fetch !== "undefined") {
    return fetch;
  }
  throw new Error("Fetch API not available. Requires Node.js 18+ or a polyfill.");
}

/**
 * AI Provider Configuration
 * Supports free models only:
 * - Ollama (local, self-hosted, free): Requires Ollama running locally
 * - Mistral API (free tier): Requires MISTRAL_API_KEY
 *
 * Environment variables:
 * - AI_PROVIDER: "ollama" (default) or "mistral"
 * - OLLAMA_BASE_URL: e.g., "http://localhost:11434" (default)
 * - MISTRAL_API_KEY: API key for Mistral API free tier
 * - OLLAMA_MODEL: Model name for Ollama (default: "mistral")
 */

/**
 * Generate bill validation prompt
 */
function generateBillPrompt(meta = {}, userMessage = "") {
  return `You are Phoenix AI, a billing assistant for invoice validation.

User request: ${userMessage || "Please validate this bill"}

Bill Metadata:
${JSON.stringify(meta, null, 2)}

Provide:
1. A validation checklist (3-5 items)
2. Any potential issues or warnings
3. A 3-step next steps guide

Keep response concise and actionable.`;
}

/**
 * Call Ollama API (local, free, self-hosted)
 */
async function callOllama(prompt, model = "mistral") {
  try {
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const fetchFn = getFetchFunction();

    const res = await fetchFn(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama error: ${res.status}`);
    }

    const data = await res.json();
    return data?.response || null;
  } catch (err) {
    console.warn(`Ollama call failed: ${err.message}`);
    return null;
  }
}

/**
 * Call Mistral API (free tier available)
 */
async function callMistral(prompt) {
  try {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) throw new Error("MISTRAL_API_KEY not set");

    const fetchFn = getFetchFunction();

    const res = await fetchFn("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small", // Free tier model
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Mistral error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.warn(`Mistral call failed: ${err.message}`);
    return null;
  }
}

/**
 * Main AI analysis function
 * Tries Ollama first (local, always free), then Mistral API if configured
 */
async function runAIAnalysis(meta = {}, userMessage = "Please analyze") {
  try {
    const provider = (process.env.AI_PROVIDER || "ollama").toLowerCase();
    const prompt = generateBillPrompt(meta, userMessage);

    let reply = null;

    if (provider === "mistral") {
      // Try Mistral API
      reply = await callMistral(prompt);
      if (!reply) {
        console.log("Mistral unavailable, falling back to Ollama...");
        reply = await callOllama(prompt);
      }
    } else {
      // Default to Ollama (local, free)
      reply = await callOllama(prompt);
      if (!reply) {
        console.log("Ollama unavailable, falling back to Mistral...");
        reply = await callMistral(prompt);
      }
    }

    if (!reply) {
      throw new Error("No AI provider available. Install Ollama or set MISTRAL_API_KEY.");
    }

    return reply;
  } catch (err) {
    throw err;
  }
}

export { runAIAnalysis };
