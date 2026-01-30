# Phoenix AI - Bill Validation Integration

## Summary

Integrated **free, self-hosted AI models** (Ollama, Mistral API) into Phoenix AI for bill validation. No expensive API keys required.

---

## 🎯 What's New

### 1. **Free AI Provider Support**
- **Ollama** (default): Local, offline, self-hosted AI (zero cost, zero internet required)
- **Mistral API**: Cloud option with free tier
- Automatic fallback between providers if one unavailable

### 2. **Improved Bill Validation**
- AI analyzes bills before upload
- Provides checklist of issues to fix
- Fallback validation checklist if AI unavailable
- Works 100% offline with Ollama

### 3. **Frontend Integration**
- Phoenix AI component now receives:
  - `billData` (invoice number, amounts, items)
  - `companyInfo` (company details, GSTIN)
  - `pdfPath` (PDF file reference)
- Metadata automatically passed to AI analysis process

---

## 🚀 Quick Start

### Option A: Ollama (Recommended - Local, Free)

```bash
# 1. Install Ollama
# Download from https://ollama.ai

# 2. Start Ollama service
ollama serve

# 3. Pull a model (first time)
ollama pull mistral

# 4. Run test
cd /path/to/project
node test-ai.js
```

**No API keys needed. All data stays on your machine.**

### Option B: Mistral API (Cloud, Free Tier)

```bash
# 1. Get API key from https://console.mistral.ai (free signup)

# 2. Set environment variable
export MISTRAL_API_KEY=your_key_here

# 3. Switch provider
export AI_PROVIDER=mistral

# 4. Run test
node test-ai.js
```

---

## 📝 Environment Variables

| Variable | Default | Example |
|----------|---------|---------|
| `AI_PROVIDER` | `ollama` | `mistral` |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Custom URL |
| `OLLAMA_MODEL` | `mistral` | `neural-chat`, `llama2` |
| `MISTRAL_API_KEY` | (none) | API key from Mistral |

### Set in Windows:
```powershell
$env:AI_PROVIDER = "ollama"
$env:OLLAMA_MODEL = "mistral"
```

### Or create `.env` file:
```
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
```

---

## 📂 Files Changed/Created

### New Files:
- **`docs/AI-SETUP.md`** - Complete setup guide (Ollama, Mistral, troubleshooting)
- **`test-ai.js`** - Quick test script to validate AI setup

### Updated Files:
- **`src/utils/phoenixAI.js`**
  - Added Ollama support (`callOllama()`)
  - Added Mistral API support (`callMistral()`)
  - Improved `runAIAnalysis()` with fallback logic
  - Prompt generation utilities

- **`src/app/api/phoenix-analyze/route.js`**
  - Updated to use new free AI providers
  - Added fallback validation checklist
  - Better error handling

- **`src/components/AIAssistant.js`**
  - Now accepts props: `billData`, `companyInfo`, `pdfPath`
  - Builds metadata for AI analysis
  - Triggers analysis process via `/api/phoenix-analyze`

- **`src/app/page.js`**
  - Passes bill metadata to `AIAssistant` component

---

## 🤖 How It Works

### User Flow:

```
User: "Analyze this bill"
  ↓
Phoenix AI: "Analyzing bill with AI..."
  ↓
AI (Ollama/Mistral): Validates invoice number, GSTIN, amounts
  ↓
Phoenix: "✅ Bill analysis complete! Here's the validation checklist:
          1. Invoice number is unique
          2. GSTIN format correct
          3. All items accounted for"
  ↓
User: Reviews analysis
```

---

## 🧪 Testing

### Test AI Integration:

```bash
# Test Ollama (make sure 'ollama serve' is running)
node test-ai.js

# Test Mistral
export MISTRAL_API_KEY=your_key
export AI_PROVIDER=mistral
node test-ai.js
```

### Expected Output:
```
🧪 Phoenix AI Test

Configuration:
  AI_PROVIDER: ollama
  OLLAMA_BASE_URL: http://localhost:11434

🔄 Calling AI for bill validation...

✅ Analysis Result:

📋 **Validation Checklist:**
1. ✓ Invoice number format is correct (INV-2026-001)
2. ✓ GSTIN is valid format (27AAACR2831H1ZK)
3. ✓ Amount is properly specified (5000)
...
```

---

## ⚙️ Model Recommendations

### Ollama Models (Local):
- **mistral** (7B) - Default, balanced speed/quality
- **neural-chat** (7B) - Faster, lighter
- **llama2** (7B or 13B) - High quality, more VRAM

### Mistral Models (Cloud):
- **mistral-small** - Fast, free tier eligible

---

## 🛠️ Troubleshooting

### "Ollama connection refused"
```bash
# Make sure Ollama is running in another terminal
ollama serve

# Check it's working
curl http://localhost:11434/api/tags
```

### "MISTRAL_API_KEY not set"
```bash
# Export the key
export MISTRAL_API_KEY=your_key_here

# Or add to .env file
echo "MISTRAL_API_KEY=your_key_here" >> .env
```

### "Model not found"
```bash
# For Ollama, pull the model
ollama pull mistral

# For Mistral, API handles it automatically
```

### No AI response but upload still works
- This is intentional! If AI unavailable, user gets basic checklist
- Upload proceeds without AI analysis
- Safe fallback behavior

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Phoenix AI Component                  │
│  (Receives billData, companyInfo, pdfPath)              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
            ┌────────────────────────────┐
            │   /api/phoenix-analyze     │
            │   (Server Route)           │
            └────────────┬───────────────┘
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
    Ollama API      Mistral API      Fallback
  (Local, Free)   (Cloud, Free)    Checklist
        │                ↓                │
        └────────────────┼────────────────┘
                         │
                         ↓
            ┌─────────────────────────┐
            │   AI Analysis Result    │
            │   (Validation Checklist)│
            └─────────────────────────┘
```

---

## 💰 Cost

- **Ollama**: FREE (runs locally, no cloud fees)
- **Mistral API**: FREE tier available
- **OpenAI**: NOT USED (was paid, now replaced)

**Total cost for bill validation: $0**

---

## 🔒 Privacy

- **Ollama**: All data stays on your machine (zero cloud uploads)
- **Mistral API**: Data sent to Mistral's servers (check their privacy policy)
- For maximum privacy: use Ollama exclusively

---

## 📚 Further Reading

- [Ollama Documentation](https://github.com/jmorganca/ollama)
- [Mistral API Docs](https://docs.mistral.ai/)
- Setup guide: `docs/AI-SETUP.md`

---

## ✅ Checklist for Your First Use

- [ ] Install Ollama (or get Mistral API key)
- [ ] Run `ollama serve` (if using Ollama)
- [ ] Run `node test-ai.js` to verify AI setup
- [ ] Create a bill in the app
- [ ] Ask Phoenix: "Analyze this bill"
- [ ] Review AI validation checklist

---

**Your bill validation is now powered by free AI. Happy analyzing!** 🚀
