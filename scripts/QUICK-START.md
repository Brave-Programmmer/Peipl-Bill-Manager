# Quick Start Guide - Gem Bill Upload Automation

## 🚀 Fast Setup (5 minutes)

### Step 1: Install Playwright

```bash
npm install playwright
npm run install-playwright
```

Or manually:
```bash
npx playwright install chromium
```

### Step 2: Update Gem Website URL

Edit `scripts/gem-bill-upload.js` and change line 18:

```javascript
gemWebsiteUrl: 'https://gem.gov.in', // Change to your actual Gem portal URL
```

### Step 3: Run the Script

```bash
npm run gem-upload <path-to-your-bill-file>
```

**Example:**
```bash
npm run gem-upload ./bills/my-bill.json
```

## 📋 What You'll See

1. **Browser Opens**: A Chromium browser window will open automatically
2. **Step-by-Step Actions**: Watch as the script:
   - Navigates to Gem website
   - Logs in (if credentials provided)
   - Finds upload section
   - Uploads your bill file
   - Fills form fields
   - Submits the form
3. **Screenshots**: Each step is captured in `./screenshots` folder
4. **Console Logs**: Detailed logs show what's happening

## 🔧 Configuration Options

### With Login Credentials

**Windows PowerShell:**
```powershell
$env:GEM_USERNAME="your-username"
$env:GEM_PASSWORD="your-password"
npm run gem-upload ./bills/my-bill.json
```

**Windows CMD:**
```cmd
set GEM_USERNAME=your-username
set GEM_PASSWORD=your-password
npm run gem-upload ./bills/my-bill.json
```

**Linux/Mac:**
```bash
export GEM_USERNAME="your-username"
export GEM_PASSWORD="your-password"
npm run gem-upload ./bills/my-bill.json
```

### Customize Selectors

If the script can't find elements, update selectors in `scripts/gem-bill-upload.js`:

1. Open the script in your editor
2. Find the selector arrays (e.g., `loginSelectors`, `fileInputSelectors`)
3. Add your website's actual selectors
4. Save and run again

## 🐛 Troubleshooting

### Browser won't launch?
```bash
npm run install-playwright
```

### Can't find elements?
1. Check screenshots in `./screenshots` folder
2. Inspect the Gem website with browser DevTools
3. Update selectors in the script

### Login issues?
- Verify credentials are correct
- Check if CAPTCHA is required (manual intervention needed)
- Try logging in manually first

## 📸 Screenshots

All screenshots are saved to `./screenshots/` with timestamps:
- `01-gem-homepage-*.png`
- `02-login-clicked-*.png`
- `07-file-uploaded-*.png`
- `09-submission-complete-*.png`

## ⚠️ Important Notes

- The script runs in **non-headless mode** - you'll see everything
- Each run creates a **fresh browser session** (no saved data)
- Screenshots help debug issues
- Script waits for elements before clicking (prevents errors)

## 📚 Full Documentation

See `scripts/README-GEM-AUTOMATION.md` for complete documentation.

## 💡 Tips

1. **First Run**: Watch the browser to understand the flow
2. **Debugging**: Check screenshots if something fails
3. **Selectors**: Use browser DevTools to find correct selectors
4. **Speed**: Adjust `slowMo` in script to slow down/speed up actions

## 🎯 Example Workflow

```bash
# 1. Install dependencies (one-time)
npm install playwright
npm run install-playwright

# 2. Set credentials (optional)
export GEM_USERNAME="your-username"
export GEM_PASSWORD="your-password"

# 3. Run automation
npm run gem-upload ./bills/bill-001.json

# 4. Watch the magic happen! ✨
```

The browser will open, perform all actions automatically, and show you the results!


