import { NextResponse } from "next/server";
import {
  runAIAnalysis,
  validateGSTIN,
  enhanceBillMetadata,
} from "../../../utils/phoenixAI";

/**
 * Enhanced Phoenix AI API Route
 * Supports multiple actions for comprehensive bill analysis
 *
 * Actions:
 * - analyze: Run AI analysis on bill metadata (free models)
 * - validate: Quick GST and format validation
 * - enrich: Enhance bill metadata with derived values
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { action, meta, message, options } = body || {};

    if (action === "validate") {
      // Quick validation endpoint
      const enhancedMeta = enhanceBillMetadata(meta || {});
      const validation = {
        gstin: {
          provided: !!meta.gstin,
          valid: meta.gstin ? validateGSTIN(meta.gstin) : null,
          stateCode: meta.gstin ? meta.gstin.substring(0, 2) : null,
        },
        amounts: {
          hasSubtotal: !!meta.subtotal,
          hasGrandTotal: !!meta.grandTotal,
          consistent:
            meta.subtotal && meta.grandTotal
              ? meta.grandTotal >= meta.subtotal
              : null,
        },
        risk: {
          isHighValue: enhancedMeta.isHighValue,
          isVeryHighValue: enhancedMeta.isVeryHighValue,
          totalAmount: enhancedMeta.totalAmount,
        },
        completeness: {
          hasInvoiceNo: !!meta.invoiceNo,
          hasDate: !!meta.invoiceDate,
          hasCustomer: !!meta.customerName,
        },
      };

      return NextResponse.json({
        success: true,
        action: "validate",
        validation,
        enhanced: enhancedMeta,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "enrich") {
      // Metadata enrichment endpoint
      const enriched = enhanceBillMetadata(meta || {});

      return NextResponse.json({
        success: true,
        action: "enrich",
        original: meta,
        enriched,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "analyze") {
      try {
        // Pre-validate and enhance metadata
        const enhancedMeta = enhanceBillMetadata(meta || {});

        // Call enhanced AI with multiple providers and better error handling
        const aiResult = await runAIAnalysis(
          enhancedMeta,
          message || "Please validate this bill comprehensively",
        );

        return NextResponse.json({
          success: true,
          action: "analyze",
          reply: aiResult.reply,
          provider: aiResult.provider,
          attemptedProviders: aiResult.attemptedProviders,
          processingTime: aiResult.processingTime,
          metadata: aiResult.metadata,
          enhanced: enhancedMeta,
          timestamp: aiResult.timestamp,
          fallback: aiResult.fallback || false,
        });
      } catch (aiErr) {
        console.warn("/api/phoenix analyze error:", aiErr.message);

        // Enhanced fallback with contextual information
        const enhancedMeta = enhanceBillMetadata(meta || {});
        const basicChecklist = generateContextualFallback(
          enhancedMeta,
          aiErr.message,
        );

        return NextResponse.json({
          success: true,
          action: "analyze",
          reply: basicChecklist,
          provider: "fallback",
          fallback: true,
          enhanced: enhancedMeta,
          error: aiErr.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(
      { success: false, error: "Unknown action" },
      { status: 400 },
    );
  } catch (err) {
    console.error("/api/phoenix error:", err);
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 },
    );
  }
}

/**
 * Generate contextual fallback based on bill metadata
 */
function generateContextualFallback(meta, error) {
  const currentDate = new Date().toLocaleDateString("en-IN");
  const financialYear = getFinancialYear();

  let fallback = `⚠️ AI Analysis Unavailable - Smart Manual Validation

� **Analysis Date:** ${currentDate}
📊 **Financial Year:** ${financialYear}
🔧 **Issue:** ${error}

`;

  // Add bill-specific context
  if (meta.invoiceNo) {
    fallback += `📄 **Bill Details:**
`;
    fallback += `• Invoice: ${meta.invoiceNo}
`;
    fallback += `• Value: ₹${meta.totalAmount?.toLocaleString("en-IN") || "Not specified"}
`;
    fallback += `• Items: ${meta.items?.length || 0}
`;
    if (meta.gstin) {
      fallback += `• GSTIN: ${meta.gstin} (${meta.gstinValid ? "✅ Valid" : "❌ Invalid"})
`;
    }
    fallback += `\n`;
  }

  // Risk-based checklist
  if (meta.isVeryHighValue) {
    fallback += `🚨 **High Value Bill (>₹5L) - Enhanced Review Required:**

`;
    fallback += `1. ✅ Verify all customer details and PAN
`;
    fallback += `2. ✅ Check TDS applicability and rates
`;
    fallback += `3. ✅ Ensure proper tax invoice format
`;
    fallback += `4. ✅ Verify HSN/SAC codes for all items
`;
    fallback += `5. ✅ Consider advance tax implications
`;
    fallback += `6. ✅ Document payment terms clearly
`;
    fallback += `7. ✅ Keep supporting documents ready
\n`;
  } else if (meta.isHighValue) {
    fallback += `⚠️ **Standard High Value Bill (>₹1L) - Additional Checks:**

`;
    fallback += `1. ✅ Verify GSTIN format and validity
`;
    fallback += `2. ✅ Check tax calculations accuracy
`;
    fallback += `3. ✅ Ensure all required fields present
`;
    fallback += `4. ✅ Verify place of supply
`;
    fallback += `5. ✅ Check invoice sequencing
\n`;
  } else {
    fallback += `📋 **Standard Bill Validation:**

`;
    fallback += `1. ✅ Invoice number format correct
`;
    fallback += `2. ✅ GST details accurate (if applicable)
`;
    fallback += `3. ✅ Amount calculations verified
`;
    fallback += `4. ✅ Customer information complete
`;
    fallback += `5. ✅ Date and terms valid
\n`;
  }

  // Action items
  fallback += `**🎯 Next Steps:**
`;
  fallback += `• Complete all checklist items above
`;
  fallback += `• Double-check calculations manually
`;
  fallback += `• Save bill after validation
`;
  fallback += `• Consider setting up AI for future analysis
\n`;

  fallback += `**💡 Setup AI Analysis:**
`;
  fallback += `• Install Ollama: https://ollama.ai
`;
  fallback += `• Run: ollama serve && ollama pull mistral
`;
  fallback += `• Test: node test-ai.js
`;
  fallback += `• See: PHOENIX-AI-INTEGRATION.md
\n`;

  fallback += `**Note:** Manual validation completed. Enable AI for automated analysis and recommendations.`;

  return fallback;
}

/**
 * Get current financial year (helper function)
 */
function getFinancialYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}
