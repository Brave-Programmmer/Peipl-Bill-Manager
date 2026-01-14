# Phoenix AI Setup Guide

Phoenix AI supports free, self-hosted models for bill validation and GEM upload automation.

## Quick Start

### Option 1: Ollama (Recommended - Local, Always Free)

**What is Ollama?** Local, offline AI that runs on your machine. Zero cost, zero external API keys needed.

1. **Install Ollama:**
   - Download from [ollama.ai](https://ollama.ai)
   - Windows: Download installer, run it
   - macOS: `brew install ollama`
   - Linux: `curl https://ollama.ai/install.sh | sh`

2. **Start Ollama:**
   ```bash
   ollama serve
   ```
   This starts the Ollama API on `http://localhost:11434` (default).

3. **Pull a model (first time):**
   ```bash
   ollama pull mistral
   ```
   Or lighter model (faster): `ollama pull neural-chat`

4. **Configure Phoenix AI:**
   - Set `AI_PROVIDER=ollama` (default, no setup needed)
   - Optionally set `OLLAMA_BASE_URL=http://localhost:11434` (already default)
   - Optionally set `OLLAMA_MODEL=mistral` (default)

5. **Test:**
   ```bash
   node test-ai.js
   ```

---

### Option 2: Mistral API (Free Tier)

**What is Mistral?** Cloud-hosted free AI with competitive free tier.

1. **Get API Key:**
   - Visit [console.mistral.ai](https://console.mistral.ai)
   - Sign up (free)
   - Create API key in dashboard

2. **Configure Phoenix AI:**
   ```bash
   export MISTRAL_API_KEY=your_api_key_here
   export AI_PROVIDER=mistral
   ```

3. **Test:**
   ```bash
   node test-ai.js
   ```

---

## Environment Variables

| Variable | Default | Example | Notes |
|----------|---------|---------|-------|
| `AI_PROVIDER` | `ollama` | `mistral` | Which provider to use |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | `http://127.0.0.1:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | `mistral` | `neural-chat`, `llama2` | Ollama model name |
| `MISTRAL_API_KEY` | (none) | `xxx...` | Mistral API key (required for Mistral) |

---

## Model Recommendations

### For Ollama (Local):
- **mistral** (7B): Balanced speed & quality, default
- **neural-chat** (7B): Faster, lighter
- **llama2** (7B/13B): Good quality, more VRAM needed
- **zephyr** (7B): Good instruction-following

### For Mistral API:
- **mistral-small**: Fast, free tier eligible
- **mistral-medium**: Higher quality

---

## Troubleshooting

### "Ollama connection refused"
- Make sure Ollama is running: `ollama serve` in another terminal
- Check URL: `curl http://localhost:11434/api/tags` should return model list

### "MISTRAL_API_KEY not set"
- Export it: `export MISTRAL_API_KEY=your_key`
- Or add to `.env` file and load via `dotenv`

### "Model not found"
- For Ollama: `ollama pull mistral`
- For Mistral: Mistral API handles this automatically

### No response from AI
- Check internet (Mistral) or Ollama service (local)
- Check logs in app console
- Fallback to manual upload (no AI required)

---

## How Phoenix AI is Used

1. **Validate Bill:** Before upload, Phoenix AI checks:
   - Invoice number format
   - GSTIN validity
   - Company info completeness
   - Potential GEM issues

2. **Generate Checklist:** AI provides a 3-step action plan for upload

3. **Safe Defaults:** If AI unavailable, upload proceeds without analysis

---

## Performance Tips

- **Ollama:** First response takes 2-5 sec (model loads). Subsequent responses faster.
- **Mistral API:** ~1-2 sec per response, depends on internet.
- **Choose lighter models** for faster responses (neural-chat vs. llama2).

---

## Cost

- **Ollama:** FREE. Runs locally, no internet required.
- **Mistral API:** FREE tier available (check their docs for limits).

