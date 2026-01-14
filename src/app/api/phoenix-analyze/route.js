import { NextResponse } from "next/server";
import { runAIAnalysis, startGemUploader } from "../../../utils/phoenixAI";

/**
 * Phoenix AI API Route
 * Supports "analyze" and "upload" actions for GEM bill automation
 *
 * Actions:
 * - analyze: Run AI analysis on bill metadata (free models)
 * - upload: Start GEM uploader process (after AI checks)
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { action, meta, message, options } = body || {};

    if (action === "analyze") {
      try {
        // Call free AI model (Ollama or Mistral)
        const reply = await runAIAnalysis(meta || {}, message || "Please validate this bill for GEM upload");
        
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
- Click "Proceed to Upload" to continue with GEM automation
- If all checks pass, the uploader will start in your browser

**Note:** AI analysis failed, but you can still upload manually.`;

        return NextResponse.json({
          success: true,
          reply: basicChecklist,
          provider: "fallback",
          fallback: true,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (action === "upload") {
      // Start the GEM uploader as a detached process on the server/machine
      try {
        const result = await startGemUploader(meta || {}, options || {});
        if (result.success) {
          return NextResponse.json({
            success: true,
            message: result.message,
            uploader: {
              pid: result.pid,
              startTime: new Date().toISOString(),
            },
          });
        }
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      } catch (uploadErr) {
        console.error("/api/phoenix upload error:", uploadErr);
        return NextResponse.json(
          { success: false, error: uploadErr.message || "Failed to start uploader" },
          { status: 500 }
        );
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
