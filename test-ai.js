#!/usr/bin/env node

/**
 * Phoenix AI Test Script
 * Tests AI integration with multiple providers
 * Run with: node test-ai.js
 */

const { runAIAnalysis } = require("./src/utils/phoenixAI.js");

// Test bill data
const testBillData = {
  invoiceNo: "INV-2026-001",
  subtotal: 5000,
  grandTotal: 5900,
  gstin: "27AAACR2831H1ZK",
  customerName: "Test Customer",
  items: [
    { description: "Laptop Computer", quantity: 1, rate: 45000, gst: 18 },
    { description: "Software License", quantity: 2, rate: 2500, gst: 18 },
  ],
};

async function testAI() {
  console.log("🧪 Phoenix AI Test\n");

  // Show configuration
  console.log("Configuration:");
  console.log(`  AI_PROVIDER: ${process.env.AI_PROVIDER || "auto"}`);
  console.log(
    `  OLLAMA_BASE_URL: ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}`,
  );
  console.log(`  OLLAMA_MODEL: ${process.env.OLLAMA_MODEL || "mistral"}`);
  console.log(
    `  MISTRAL_API_KEY: ${process.env.MISTRAL_API_KEY ? "✓ Set" : "✗ Not set"}`,
  );
  console.log(
    `  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "✓ Set" : "✗ Not set"}`,
  );
  console.log(
    `  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "✓ Set" : "✗ Not set"}`,
  );
  console.log("\n🔄 Calling AI for bill validation...\n");

  try {
    const result = await runAIAnalysis(
      testBillData,
      "Please analyze this bill for validation and optimization",
    );

    console.log("✅ Analysis Result:\n");
    console.log("📋 **Validation Report:**");
    console.log(result.reply);
    console.log("\n---");
    console.log(`🤖 Provider used: ${result.provider}`);
    console.log(
      `🔄 Attempted providers: ${result.attemptedProviders.join(", ")}`,
    );
    console.log(`⏰ Timestamp: ${result.timestamp}`);
  } catch (error) {
    console.error("❌ AI Test Failed:", error.message);
    console.log("\n💡 Troubleshooting tips:");
    console.log('1. For Ollama: Make sure "ollama serve" is running');
    console.log("2. For Mistral: Set MISTRAL_API_KEY environment variable");
    console.log("3. For Gemini: Set GEMINI_API_KEY environment variable");
    console.log("4. For OpenAI: Set OPENAI_API_KEY environment variable");
    console.log("\n📖 Setup guide: See PHOENIX-AI-INTEGRATION.md");
  }
}

// Run the test
testAI().catch(console.error);
