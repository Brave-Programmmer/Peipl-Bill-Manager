import { NextResponse } from "next/server";
import { runAIAnalysis } from "../../../utils/phoenixAI";

/**
 * Phoenix AI API Route
 * Supports "analyze" action for bill validation
 *
 * Actions:
 * - analyze: Run AI analysis on bill metadata (free models)
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { action, meta, message, options } = body || {};

    if (action === "analyze") {
      try {
        // Call free AI model (Ollama or Mistral)
        const reply = await runAIAnalysis(meta || {}, message || "Please validate this bill");
        
        return NextResponse.json({
          success: true,
          reply,
          provider: process.env.AI_PROVIDER || "ollama",
          timestamp: new Date().toISOString(),
        });
      } catch (aiErr) {
        console.warn("/api/phoenix analyze error:", aiErr.message);
        
        // Fallback: provide a basic validation checklist
        const basicChecklist = `⚠️ AI analysis unavailable, but here's a manual checklist:

📋 **Pre-Upload Validation Checklist:**
1. ✓ Invoice number is unique and properly formatted
2. ✓ GST number is correct and valid (if applicable)
3. ✓ Bill amount and items are accurate
4. ✓ Customer details are complete
5. ✓ PDF is properly generated and readable

**Next Steps:**
- Review the checklist above
- Ensure all checks pass before proceeding

**Note:** AI analysis failed, but you can still validate manually.`;

        return NextResponse.json({
          success: true,
          reply: basicChecklist,
          provider: "fallback",
          fallback: true,
          timestamp: new Date().toISOString(),
        });
      }
    }


    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("/api/phoenix error:", err);
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
