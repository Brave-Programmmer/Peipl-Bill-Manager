# Phoenix AI Setup Guide

## Quick Setup Options

### Option 1: Ollama (Recommended - Free, Local)

```bash
# 1. Install Ollama
# Download from https://ollama.ai

# 2. Start Ollama service
ollama serve

# 3. Pull a model (choose one)
ollama pull mistral          # Default, balanced
ollama pull neural-chat      # Faster, lighter  
ollama pull llama2           # High quality

# 4. Test the setup
node test-ai.js
```

**Environment Variables (Optional):**
```bash
# Windows PowerShell
$env:AI_PROVIDER = "ollama"
$env:OLLAMA_MODEL = "mistral"
$env:OLLAMA_BASE_URL = "http://localhost:11434"

# Or create .env file:
AI_PROVIDER=ollama
OLLAMA_MODEL=mistral
OLLAMA_BASE_URL=http://localhost:11434
```

### Option 2: Mistral API (Free Tier)

```bash
# 1. Get API key
# Visit https://console.mistral.ai (free signup)

# 2. Set environment variables
# Windows PowerShell
$env:AI_PROVIDER = "mistral"
$env:MISTRAL_API_KEY = "your_api_key_here"

# Or create .env file:
AI_PROVIDER=mistral
MISTRAL_API_KEY=your_api_key_here

# 3. Test the setup
node test-ai.js
```

### Option 3: Google Gemini (Free Tier)

```bash
# 1. Get API key
# Visit https://makersuite.google.com/app/apikey

# 2. Set environment variables
# Windows PowerShell
$env:AI_PROVIDER = "gemini"
$env:GEMINI_API_KEY = "your_api_key_here"

# Or create .env file:
AI_PROVIDER=gemini
GEMINI_API_KEY=your_api_key_here

# 3. Test the setup
node test-ai.js
```

## Enhanced Features

### New API Endpoints

The enhanced Phoenix AI now supports multiple actions:

#### 1. Analyze (Full AI Analysis)
```javascript
fetch('/api/phoenix-analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'analyze',
    meta: { /* bill metadata */ },
    message: 'Analyze this bill'
  })
})
```

#### 2. Validate (Quick Validation)
```javascript
fetch('/api/phoenix-analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'validate',
    meta: { /* bill metadata */ }
  })
})
```

#### 3. Enrich (Metadata Enhancement)
```javascript
fetch('/api/phoenix-analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'enrich',
    meta: { /* bill metadata */ }
  })
})
```

### Enhanced Bill Analysis

The AI now provides:

- **Critical Validation Checklist** (7-10 items)
- **Compliance Analysis** (GST regulations, tax applicability)
- **Financial Risk Assessment** (High-value alerts, TDS applicability)
- **Optimization Opportunities** (Tax planning, cost savings)
- **Actionable Recommendations** (Specific steps for improvement)

### Smart Fallback System

When AI providers are unavailable, the system provides:

- Risk-based validation checklists
- Contextual recommendations
- Enhanced manual validation guidance
- Setup instructions for AI providers

## Troubleshooting

### "Ollama model not found"
```bash
# Pull the required model
ollama pull mistral
# or
ollama pull neural-chat
# or  
ollama pull llama2
```

### "Ollama connection refused"
```bash
# Make sure Ollama is running
ollama serve

# Test connection
curl http://localhost:11434/api/tags
```

### API Key Issues
```bash
# Verify API key is set
echo $MISTRAL_API_KEY    # Linux/Mac
echo $env:MISTRAL_API_KEY  # Windows

# Check .env file
cat .env
```

### Performance Issues

1. **For Ollama:**
   - Use `neural-chat` for faster responses
   - Ensure sufficient RAM (8GB+ recommended)

2. **For Cloud APIs:**
   - Check internet connection
   - Verify API key validity
   - Monitor rate limits

## Model Recommendations

### Ollama Models (Local)
- **mistral** (7B): Default, balanced speed/quality
- **neural-chat** (7B): Faster, lighter responses
- **llama2** (7B/13B): Higher quality, more VRAM needed

### Cloud Models
- **mistral-small-latest**: Fast, free tier eligible
- **gemini-pro**: Google's model, free tier available

## Advanced Configuration

### Custom Prompts
Edit `src/utils/phoenixAI.js` to customize analysis prompts for your specific business needs.

### Provider Priority
Change the fallback order in `runAIAnalysis()` to prioritize your preferred providers.

### Timeout Settings
Adjust timeout values in provider functions for your network conditions.

## Testing

### Basic Test
```bash
node test-ai.js
```

### Integration Test
1. Open the bill manager application
2. Create a test bill with items
3. Click the Phoenix AI assistant
4. Type "analyze this bill"
5. Review the AI analysis

### Expected Output
```
🧪 Phoenix AI Test

Configuration:
  AI_PROVIDER: ollama
  OLLAMA_BASE_URL: http://localhost:11434

🔄 Calling AI for bill validation...

✅ Analysis Result:

📋 **Validation Report:**
1. ✓ Invoice number format is correct (INV-2026-001)
2. ✓ GSTIN is valid format (27AAACR2831H1ZK)
3. ✓ Amount calculations are accurate
...
```

## Security & Privacy

- **Ollama**: 100% local, no data leaves your machine
- **Mistral**: Data sent to Mistral's EU servers
- **Gemini**: Data sent to Google's servers
- **OpenAI**: Data sent to OpenAI's servers

For maximum privacy, use Ollama exclusively.

## Support

For issues:
1. Check this guide first
2. Run `node test-ai.js` for diagnostics
3. Review `PHOENIX-AI-INTEGRATION.md`
4. Check application logs for detailed error messages
