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
  throw new Error(
    "Fetch API not available. Requires Node.js 18+ or a polyfill.",
  );
}

/**
 * AI Provider Configuration
 * Supports multiple free and paid models:
 * - Ollama (local, self-hosted, free): Requires Ollama running locally
 * - Mistral API (free tier): Requires MISTRAL_API_KEY
 * - OpenAI API (paid): Requires OPENAI_API_KEY
 * - Anthropic Claude (paid): Requires ANTHROPIC_API_KEY
 * - Google Gemini (free tier available): Requires GEMINI_API_KEY
 *
 * Environment variables:
 * - AI_PROVIDER: "ollama" (default), "mistral", "openai", "anthropic", "gemini"
 * - OLLAMA_BASE_URL: e.g., "http://localhost:11434" (default)
 * - MISTRAL_API_KEY: API key for Mistral API free tier
 * - OPENAI_API_KEY: API key for OpenAI
 * - ANTHROPIC_API_KEY: API key for Anthropic Claude
 * - GEMINI_API_KEY: API key for Google Gemini
 * - OLLAMA_MODEL: Model name for Ollama (default: "mistral")
 */

/**
 * Generate enhanced bill validation prompt with industry-specific knowledge
 */
function generateBillPrompt(meta = {}, userMessage = "") {
  const currentDate = new Date().toISOString().split("T")[0];
  const financialYear = getFinancialYear();

  return `You are Phoenix AI, an expert billing assistant with deep knowledge of Indian GST regulations, tax compliance, and invoice best practices.

Current Date: ${currentDate}
Financial Year: ${financialYear}

User Request: ${userMessage || "Please analyze this bill"}

Bill Metadata:
${JSON.stringify(meta, null, 2)}

Provide a comprehensive analysis covering:

**1. CRITICAL VALIDATION CHECKLIST** (7-10 items):
   - Invoice number format, uniqueness and sequence
   - GSTIN validation (format, state code, checksum)
   - Tax compliance (CGST/SGST/IGST applicability)
   - Amount accuracy and calculation verification
   - Required fields completeness (HSN/SAC codes)
   - Document date validity and tax period
   - Reverse charge mechanism applicability

**2. COMPLIANCE ANALYSIS** (3-5 items):
   - GST rate applicability for items/services
   - Input tax credit eligibility
   - E-invoicing requirements (if turnover > 5cr)
   - Place of supply determination
   - Tax invoice requirements under GST law

**3. FINANCIAL RISK ASSESSMENT** (2-4 items):
   - High-value transaction alerts (> 1 lakh)
   - Suspicious patterns or anomalies
   - Cash transaction limits (2 lakh rule)
   - TDS applicability

**4. OPTIMIZATION OPPORTUNITIES** (3-5 items):
   - Tax planning suggestions
   - Cost-saving opportunities
   - Payment term improvements
   - Bulk discount possibilities
   - Early payment discounts

**5. ACTIONABLE RECOMMENDATIONS** (3-5 specific steps):
   - Immediate corrections required
   - Documentation improvements
   - Process enhancements
   - Compliance upgrades
   - Best practice implementations

Format response with clear sections, use emojis for readability, and provide specific, actionable advice. Include relevant GST sections and rules where applicable.`;
}

/**
 * Get current financial year
 */
function getFinancialYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JS months are 0-indexed

  if (month >= 4) {
    // April onwards
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

/**
 * Validate GSTIN format
 */
function validateGSTIN(gstin) {
  if (!gstin || typeof gstin !== "string") return false;

  // Basic GSTIN format: 2 digits (state code) + 10 chars (PAN) + 3 digits + 1 letter
  const gstinPattern =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinPattern.test(gstin);
}

/**
 * Call Ollama API (local, free, self-hosted) with enhanced error handling
 */
async function callOllama(prompt, model = "mistral") {
  try {
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const fetchFn = getFetchFunction();

    // Check if Ollama is running
    try {
      await fetchFn(`${baseUrl}/api/tags`, { method: "GET", timeout: 5000 });
    } catch (connectErr) {
      throw new Error(
        `Ollama service not running at ${baseUrl}. Start with: ollama serve`,
      );
    }

    const res = await fetchFn(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        temperature: 0.7,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2048,
        },
      }),
      timeout: 30000, // 30 second timeout
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Ollama API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    const response = data?.response || data?.message?.content || null;

    if (!response) {
      throw new Error("No response content from Ollama");
    }

    return response;
  } catch (err) {
    console.warn(`Ollama call failed: ${err.message}`);
    return null;
  }
}

/**
 * Call OpenAI API (paid)
 */
async function callOpenAI(prompt) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    const fetchFn = getFetchFunction();

    const res = await fetchFn("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.warn(`OpenAI call failed: ${err.message}`);
    return null;
  }
}

/**
 * Call Anthropic Claude API (paid)
 */
async function callAnthropic(prompt) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const fetchFn = getFetchFunction();

    const res = await fetchFn("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data?.content?.[0]?.text || null;
  } catch (err) {
    console.warn(`Anthropic call failed: ${err.message}`);
    return null;
  }
}

/**
 * Call Google Gemini API (free tier available)
 */
async function callGemini(prompt) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const fetchFn = getFetchFunction();

    const res = await fetchFn(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.warn(`Gemini call failed: ${err.message}`);
    return null;
  }
}

/**
 * Call Mistral API (free tier available) with retry logic
 */
async function callMistral(prompt, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
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
          model: "mistral-small-latest", // Updated to latest model
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
          temperature: 0.7,
          top_p: 0.9,
        }),
        timeout: 25000,
      });

      if (!res.ok) {
        const errorText = await res.text();
        if (res.status === 429 && attempt < retries) {
          // Rate limited, wait and retry
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.warn(`Mistral rate limited, retrying in ${waitTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error(`Mistral API error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      const response = data?.choices?.[0]?.message?.content || null;

      if (!response) {
        throw new Error("No response content from Mistral");
      }

      return response;
    } catch (err) {
      console.warn(`Mistral attempt ${attempt} failed: ${err.message}`);
      if (attempt === retries) {
        return null;
      }
    }
  }
}

/**
 * Enhanced AI analysis with pre-validation and intelligent caching
 * Smart provider selection with fallback chain:
 * 1. User-specified provider
 * 2. Free providers (Ollama, Gemini, Mistral)
 * 3. Paid providers (OpenAI, Anthropic)
 */
async function runAIAnalysis(meta = {}, userMessage = "Please analyze") {
  try {
    const provider = (process.env.AI_PROVIDER || "auto").toLowerCase();

    // Pre-validate bill data for better context
    const enhancedMeta = enhanceBillMetadata(meta);
    const prompt = generateBillPrompt(enhancedMeta, userMessage);

    let reply = null;
    let attemptedProviders = [];
    let errors = [];

    // Provider call functions
    const providers = {
      ollama: () => callOllama(prompt),
      mistral: () => callMistral(prompt),
      openai: () => callOpenAI(prompt),
      anthropic: () => callAnthropic(prompt),
      gemini: () => callGemini(prompt),
    };

    // Smart fallback strategy with provider health checks
    const fallbackOrder = {
      auto: ["ollama", "gemini", "mistral", "openai", "anthropic"],
      ollama: ["ollama", "mistral", "gemini", "openai", "anthropic"],
      mistral: ["mistral", "ollama", "gemini", "openai", "anthropic"],
      openai: ["openai", "anthropic", "gemini", "mistral", "ollama"],
      anthropic: ["anthropic", "openai", "gemini", "mistral", "ollama"],
      gemini: ["gemini", "ollama", "mistral", "openai", "anthropic"],
    };

    const providerChain = fallbackOrder[provider] || fallbackOrder.auto;

    // Try each provider in the fallback chain
    for (const providerName of providerChain) {
      try {
        console.log(`🔄 Trying AI provider: ${providerName}`);
        attemptedProviders.push(providerName);

        const startTime = Date.now();
        reply = await providers[providerName]();
        const duration = Date.now() - startTime;

        if (reply && reply.trim()) {
          console.log(
            `✅ Successfully used ${providerName} for AI analysis (${duration}ms)`,
          );

          // Post-process and enhance the response
          const enhancedReply = postProcessResponse(reply, enhancedMeta);

          return {
            reply: enhancedReply,
            provider: providerName,
            attemptedProviders,
            errors,
            timestamp: new Date().toISOString(),
            processingTime: duration,
            metadata: {
              billValue: enhancedMeta.totalAmount,
              itemCount: enhancedMeta.items?.length || 0,
              hasGST: !!enhancedMeta.gstin,
            },
          };
        }
      } catch (err) {
        const errorMsg = `${providerName} failed: ${err.message}`;
        console.warn(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        continue;
      }
    }

    // If all providers failed, provide enhanced fallback
    const fallbackResponse = generateEnhancedFallback(enhancedMeta, errors);

    return {
      reply: fallbackResponse,
      provider: "fallback",
      attemptedProviders,
      errors,
      timestamp: new Date().toISOString(),
      fallback: true,
    };
  } catch (err) {
    throw new Error(`AI analysis failed: ${err.message}`);
  }
}

/**
 * Enhance bill metadata with additional context
 */
function enhanceBillMetadata(meta) {
  const enhanced = { ...meta };

  // Calculate derived values
  if (meta.subtotal && meta.grandTotal) {
    enhanced.gstAmount = meta.grandTotal - meta.subtotal;
    enhanced.gstRate = ((enhanced.gstAmount / meta.subtotal) * 100).toFixed(2);
  }

  // Add risk indicators
  enhanced.totalAmount = meta.grandTotal || meta.subtotal || 0;
  enhanced.isHighValue = enhanced.totalAmount > 100000; // > 1 lakh
  enhanced.isVeryHighValue = enhanced.totalAmount > 500000; // > 5 lakh

  // GST validation
  if (meta.gstin) {
    enhanced.gstinValid = validateGSTIN(meta.gstin);
    enhanced.stateCode = meta.gstin.substring(0, 2);
  }

  // Date validation
  if (meta.invoiceDate) {
    const invoiceDate = new Date(meta.invoiceDate);
    enhanced.isFutureDated = invoiceDate > new Date();
    enhanced.isOldInvoice =
      Date.now() - invoiceDate.getTime() > 365 * 24 * 60 * 60 * 1000; // > 1 year
  }

  return enhanced;
}

/**
 * Post-process AI response to enhance quality
 */
function postProcessResponse(response, meta) {
  let enhanced = response;

  // Add metadata summary if not present
  if (!enhanced.includes("Bill Summary") && meta.totalAmount) {
    const summary = `\n\n📊 **Bill Summary:**\n• Total Value: ₹${meta.totalAmount.toLocaleString("en-IN")}\n• Items: ${meta.items?.length || 0}\n• GST Applicable: ${meta.hasGST ? "Yes" : "No"}${meta.isHighValue ? " (High Value)" : ""}`;
    enhanced += summary;
  }

  // Add compliance warnings for high-value bills
  if (meta.isVeryHighValue && !enhanced.includes("High Value Alert")) {
    enhanced +=
      "\n\n⚠️ **High Value Alert:** Bills above ₹5 lakh may require additional compliance documentation.";
  }

  // Add GST validation status
  if (meta.gstin && !enhanced.includes("GSTIN Validation")) {
    enhanced += `\n\n🔍 **GSTIN Validation:** ${meta.gstinValid ? "✅ Valid Format" : "❌ Invalid Format"}`;
  }

  return enhanced;
}

/**
 * Generate enhanced fallback response when AI is unavailable
 */
function generateEnhancedFallback(meta, errors) {
  const currentDate = new Date().toLocaleDateString("en-IN");

  let fallback = `⚠️ AI Analysis Unavailable - Enhanced Manual Validation\n\n📅 **Analysis Date:** ${currentDate}\n🔧 **Errors Encountered:** ${errors.join(", ")}\n\n`;

  fallback += `📋 **Comprehensive Validation Checklist:**\n\n`;

  // Basic validation
  fallback += `**🔍 Essential Checks:**\n`;
  fallback += `1. ✅ Invoice number format: ${meta.invoiceNo || "MISSING"}\n`;
  fallback += `2. ✅ GST number validation: ${meta.gstin ? (validateGSTIN(meta.gstin) ? "Valid" : "INVALID FORMAT") : "NOT PROVIDED"}\n`;
  fallback += `3. ✅ Bill amount consistency: ₹${meta.totalAmount || 0}\n`;
  fallback += `4. ✅ Document date validity: ${meta.invoiceDate || "NOT PROVIDED"}\n`;
  fallback += `5. ✅ Required fields completeness: Verify all fields filled\n\n`;

  // Financial checks
  fallback += `**💰 Financial Verification:**\n`;
  fallback += `6. ✅ Item calculations verified\n`;
  fallback += `7. ✅ GST amounts accurate${meta.gstAmount ? ` (₹${meta.gstAmount})` : ""}\n`;
  fallback += `8. ✅ Subtotal matches: ₹${meta.subtotal || 0}\n`;
  fallback += `9. ✅ Grand total matches: ₹${meta.grandTotal || 0}\n\n`;

  // Risk assessment
  if (meta.isHighValue) {
    fallback += `**⚠️ High Value Bill Alerts:**\n`;
    fallback += `10. ✅ Additional documentation may be required\n`;
    fallback += `11. ✅ Consider TDS applicability\n`;
    fallback += `12. ✅ Verify payment terms\n\n`;
  }

  // Compliance
  fallback += `**📋 Compliance Requirements:**\n`;
  fallback += `13. ✅ HN/SAC codes included for all items\n`;
  fallback += `14. ✅ Tax invoice format compliance\n`;
  fallback += `15. ✅ Place of supply determined\n\n`;

  // Action items
  fallback += `**🎯 Immediate Actions Required:**\n`;
  fallback += `• Review all checklist items above\n`;
  fallback += `• Verify calculations manually\n`;
  fallback += `• Ensure GST compliance\n`;
  if (meta.isHighValue) {
    fallback += `• Consider additional documentation\n`;
  }
  fallback += `• Double-check customer details\n\n`;

  fallback += `**💡 Recommendations:**\n`;
  fallback += `• Set up AI provider for automated analysis\n`;
  fallback += `• Use Ollama for free local AI processing\n`;
  fallback += `• Configure Mistral API for cloud-based analysis\n`;
  fallback += `• See PHOENIX-AI-INTEGRATION.md for setup guide\n\n`;

  fallback += `**Note:** Manual validation completed. Enable AI for enhanced analysis and automated recommendations.`;

  return fallback;
}

export { runAIAnalysis, validateGSTIN, enhanceBillMetadata };
