// Server-side helper for GEM automation and AI analysis
const fetch = global.fetch || require("node-fetch");

async function runAIAnalysis(meta, userMessage) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

    const prompt = `You are Phoenix AI, a billing assistant. The user asked: ${userMessage}\n\nBill metadata:\n${JSON.stringify(
      meta || {},
      null,
      2,
    )}\n\nProvide a concise checklist of potential issues and a 3-step upload checklist for GEM.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI error: ${res.status} ${text}`);
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || null;
    return reply;
  } catch (err) {
    throw err;
  }
}

module.exports = { runAIAnalysis };
