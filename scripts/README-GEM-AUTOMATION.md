# Gem Website Bill Upload Automation

This Playwright script automates the process of uploading bills to the Gem website. It runs in non-headless mode so you can see all actions being performed in real-time.

## Features

- ✅ Opens a real browser window (non-headless)
- ✅ Automates bill upload process
- ✅ Takes screenshots at each step
- ✅ Detailed logging of all actions
- ✅ Error handling and retry logic
- ✅ Waits for elements before interacting
- ✅ Extracts and displays status messages

## Prerequisites

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

## Installation

### Step 1: Install Dependencies

Navigate to your project root directory and install Playwright:

```bash
npm install playwright
```

### Step 2: Install Browser Binaries

Playwright needs browser binaries to run. Install them with:

```bash
npx playwright install chromium
```

This will download Chromium browser binaries (approximately 150MB).

### Step 3: Verify Installation

Check if Playwright is installed correctly:

```bash
npx playwright --version
```

## Configuration

### 1. Update Gem Website URL

Open `scripts/gem-bill-upload.js` and update the `gemWebsiteUrl`:

```javascript
const CONFIG = {
  gemWebsiteUrl: 'https://gem.gov.in', // Change to actual Gem portal URL
  // ... other config
};
```

### 2. Update Selectors (Optional)

The script uses common CSS selectors to find elements. You may need to update them based on the actual Gem website structure:

- Login button selectors
- Form field selectors
- File upload input selectors
- Submit button selectors

### 3. Set Environment Variables (Optional)

If login is required, you can set credentials as environment variables:

**Windows (PowerShell):**
```powershell
$env:GEM_USERNAME="your-username"
$env:GEM_PASSWORD="your-password"
```

**Windows (CMD):**
```cmd
set GEM_USERNAME=your-username
set GEM_PASSWORD=your-password
```

**Linux/Mac:**
```bash
export GEM_USERNAME="your-username"
export GEM_PASSWORD="your-password"
```

## Usage

### Basic Usage

Run the script with a bill file path:

```bash
node scripts/gem-bill-upload.js <path-to-bill-file>
```

**Example:**
```bash
node scripts/gem-bill-upload.js ./bills/my-bill.json
```

### Without Arguments

If no file path is provided, it defaults to `./bill.json`:

```bash
node scripts/gem-bill-upload.js
```

### With Login Credentials

```bash
# Set credentials first
export GEM_USERNAME="your-username"
export GEM_PASSWORD="your-password"

# Run script
node scripts/gem-bill-upload.js ./bills/my-bill.json
```

## How It Works

The script performs the following steps:

1. **Launch Browser**: Opens Chromium in non-headless mode
2. **Navigate to Gem**: Goes to the Gem website
3. **Login** (if credentials provided): Logs into the portal
4. **Navigate to Upload Section**: Finds and clicks the upload/bill section
5. **Upload File**: Selects and uploads the bill file
6. **Fill Form Fields**: Fills any required form fields (bill number, date, amount, etc.)
7. **Submit**: Clicks the submit button
8. **Extract Status**: Captures and displays the submission status
9. **Screenshots**: Takes screenshots at each step for reference

## Screenshots

Screenshots are automatically saved to the `./screenshots` directory with timestamps:

- `01-gem-homepage-<timestamp>.png`
- `02-login-clicked-<timestamp>.png`
- `03-login-page-<timestamp>.png`
- `04-after-login-<timestamp>.png`
- `05-upload-section-<timestamp>.png`
- `06-file-input-found-<timestamp>.png`
- `07-file-uploaded-<timestamp>.png`
- `08-form-filled-<timestamp>.png`
- `09-submission-complete-<timestamp>.png`

## Troubleshooting

### Browser Not Launching

If the browser doesn't launch, make sure browser binaries are installed:

```bash
npx playwright install chromium
```

### Elements Not Found

If the script can't find elements:

1. Check the Gem website structure
2. Update selectors in the script
3. Use browser DevTools to inspect elements
4. Check screenshots in `./screenshots` folder

### Login Issues

If login fails:

1. Verify credentials are correct
2. Check if the website requires CAPTCHA (manual intervention needed)
3. Update login selectors in the script
4. Try logging in manually first, then continue

### File Upload Issues

If file upload fails:

1. Verify the file path is correct
2. Check file format is supported (PDF, images, etc.)
3. Ensure file size is within limits
4. Check file input selector is correct

## Customization

### Adjust Timeouts

Modify timeouts in the `CONFIG` object:

```javascript
const CONFIG = {
  navigationTimeout: 30000, // 30 seconds
  actionTimeout: 10000,      // 10 seconds
};
```

### Change Browser Speed

Adjust the `slowMo` parameter in the `chromium.launch()` call:

```javascript
const browser = await chromium.launch({
  headless: false,
  slowMo: 500, // Milliseconds to slow down actions
});
```

### Disable Screenshots

Set `takeScreenshots` to `false`:

```javascript
const CONFIG = {
  takeScreenshots: false,
};
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit credentials** to version control
2. Use environment variables for sensitive data
3. The script does NOT access your existing browser session
4. Each run creates a fresh browser context
5. No cookies or data persist between runs

## Example Output

```
[2024-01-15T10:30:00.000Z] ℹ️ 🚀 Starting Gem Bill Upload Automation
[2024-01-15T10:30:00.001Z] ℹ️ ============================================================
[2024-01-15T10:30:00.002Z] ℹ️ Launching browser (non-headless mode)...
[2024-01-15T10:30:02.500Z] ℹ️ Step 1: Navigating to Gem website...
[2024-01-15T10:30:02.501Z] ℹ️ URL: https://gem.gov.in
[2024-01-15T10:30:05.200Z] ✅ Successfully navigated to Gem website
[2024-01-15T10:30:05.201Z] ✅ Screenshot saved: ./screenshots/01-gem-homepage-1234567890.png
...
```

## Support

If you encounter issues:

1. Check the console output for error messages
2. Review screenshots in the `./screenshots` folder
3. Verify all selectors match the current Gem website structure
4. Ensure your bill file is in the correct format

## License

This script is provided as-is for automation purposes. Use responsibly and in accordance with Gem website terms of service.


