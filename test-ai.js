#!/usr/bin/env node

/**
 * Quick test script for Phoenix AI
 * Tests Ollama and Mistral API integration
 * Usage: node test-ai.js
 */

const { runAIAnalysis } = require("./src/utils/phoenixAI.js");

async function testAI() {
  console.log("🧪 Phoenix AI Test\n");
  console.log("Configuration:");
  console.log(`  AI_PROVIDER: ${process.env.AI_PROVIDER || "ollama"}`);
  console.log(`  OLLAMA_BASE_URL: ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}`);
  console.log(`  MISTRAL_API_KEY: ${process.env.MISTRAL_API_KEY ? "SET" : "NOT SET"}\n`);

  const testBill = {
    invoiceNo: "INV-2026-001",
    gstin: "27AAACR2831H1ZK",
    companyName: "Acme Corp",
    amount: 5000,
    description: "Consulting Services",
  };

  try {
    console.log("🔄 Calling AI for bill validation...\n");
    const analysis = await runAIAnalysis(testBill, "Validate this bill for GEM upload");
    console.log("✅ Analysis Result:\n");
    console.log(analysis);
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error(
      "\n💡 Troubleshooting:\n" +
        "  - For Ollama: Make sure 'ollama serve' is running in another terminal\n" +
        "  - For Mistral: Set MISTRAL_API_KEY env variable\n" +
        "  - See docs/AI-SETUP.md for full setup instructions"
    );
    process.exit(1);
  }
}

testAI();
