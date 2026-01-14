/**
 * Puppeteer Automation Script for Gem Website Bill Upload
 *
 * This script automates the process of uploading bills to the Gem website.
 * It opens a real browser window so you can see all actions being performed.
 *
 * Requirements:
 * - Node.js installed
 * - Node.js installed
 * - Puppeteer installed (npm install puppeteer)
 */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

// Configuration
const CONFIG = {
  // Gem website URLs
  gemLoginUrl: "https://sso.gem.gov.in/ARXSSO/oauth/doLogin", // Login URL
  gemOrdersUrl:
    "https://fulfilment.gem.gov.in/fulfilment/home#WORKSPACE_ID=ORDERS_WS", // Orders tab URL

  // Wait timeouts (in milliseconds)
  navigationTimeout: 60000, // 60 seconds
  actionTimeout: 15000, // 15 seconds
  manualWaitTimeout: 300000, // 5 minutes for manual actions

  // Screenshot settings
  takeScreenshots: true,
  screenshotPath: "./screenshots",

  // Logging
  verbose: true,
};

/**
 * Logging utility function
 */
function log(message, type = "info") {
  const timestamp = new Date().toISOString();
  const prefix = type === "error" ? "❌" : type === "success" ? "✅" : "ℹ️";
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * Create screenshots directory if it doesn't exist
 */
function ensureScreenshotDir() {
  if (CONFIG.takeScreenshots && !fs.existsSync(CONFIG.screenshotPath)) {
    fs.mkdirSync(CONFIG.screenshotPath, { recursive: true });
    log(`Created screenshot directory: ${CONFIG.screenshotPath}`);
  }
}

/**
 * Take a screenshot with a descriptive name
 */
async function takeScreenshot(page, name) {
  if (CONFIG.takeScreenshots) {
    const screenshotPath = path.join(
      CONFIG.screenshotPath,
      `${name}-${Date.now()}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log(`Screenshot saved: ${screenshotPath}`, "success");
  }
}

/**
 * Wait for element to be visible and clickable
 */
async function waitForElement(page, selector, description) {
  log(`Waiting for element: ${description} (${selector})`);
  try {
    await page.waitForSelector(selector, { visible: true, timeout: CONFIG.actionTimeout });
    log(`Element found: ${description}`, "success");
    return true;
  } catch (error) {
    log(`Element not found: ${description} - ${error.message}`, "error");
    return false;
  }
}

/**
 * Safe click function with retry logic
 */
async function safeClick(page, selector, description) {
  log(`Attempting to click: ${description}`);

  try {
    // Wait for element to be visible
    await waitForElement(page, selector, description);

    // Scroll element into view
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, selector);

    // Wait a bit for scroll animation
    await sleep(500);

    // Click the element
    await page.click(selector, { delay: 100 });
    log(`Successfully clicked: ${description}`, "success");

    // Wait a bit after click for page to respond
    await sleep(1000);

    return true;
  } catch (error) {
    log(`Failed to click ${description}: ${error.message}`, "error");
    return false;
  }
}

/**
 * Safe fill function for input fields
 */
async function safeFill(page, selector, value, description) {
  log(`Filling field: ${description} with value: ${value}`);

  try {
    await waitForElement(page, selector, description);

    // Use DOM to set value and dispatch events (works for most inputs)
    await page.evaluate((sel, val) => {
      const el = document.querySelector(sel);
      if (!el) return;
      el.focus();
      if ("value" in el) el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("blur", { bubbles: true }));
    }, selector, value);

    log(`Successfully filled: ${description}`, "success");
    return true;
  } catch (error) {
    log(`Failed to fill ${description}: ${error.message}`, "error");
    return false;
  }
}

/**
 * Extract text from page
 */
async function extractText(page, selector, description) {
  log(`Extracting text from: ${description}`);

  try {
    await waitForElement(page, selector, description);
    const text = await page.$eval(selector, (el) => el.textContent && el.textContent.trim());
    log(`Extracted text: ${text}`, "success");
    return text;
  } catch (error) {
    log(`Failed to extract text: ${error.message}`, "error");
    return null;
  }
}

// Bill metadata passed from Electron via environment variable GEM_BILL_META
const BILL_META = (() => {
  try {
    const raw = process.env.GEM_BILL_META || "{}";
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
})();

/**
 * Optional AI analysis helper. Supports free models:
 * - Ollama (local, self-hosted)
 * - Mistral API (free tier)
 *
 * Environment variables:
 * - AI_PROVIDER: "ollama" (default) or "mistral"
 * - OLLAMA_BASE_URL: Default is http://localhost:11434
 * - OLLAMA_MODEL: Default is "mistral"
 * - MISTRAL_API_KEY: Required for Mistral API
 */
async function runAIAnalysis(meta) {
  try {
    const provider = (process.env.AI_PROVIDER || "ollama").toLowerCase();

    const prompt = `You are a bill validation assistant for GEM (Government e-Marketplace).

Validate this bill metadata for GEM upload and provide a short 3-step checklist and possible issues:

${JSON.stringify(meta, null, 2)}

Respond with a concise checklist and any warnings.`;

    // Try Ollama first (local, free)
    if (provider === "ollama" || !process.env.MISTRAL_API_KEY) {
      return await callOllama(prompt);
    }

    // Try Mistral API
    return await callMistral(prompt);
  } catch (e) {
    console.warn("AI analysis failed:", e && e.message ? e.message : e);
    return null;
  }
}

async function callOllama(prompt) {
  try {
    if (typeof fetch !== "function") return null;

    const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const model = process.env.OLLAMA_MODEL || "mistral";

    const res = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.warn(`Ollama error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data?.response || null;
  } catch (e) {
    console.warn("Ollama call failed:", e && e.message ? e.message : e);
    return null;
  }
}

async function callMistral(prompt) {
  try {
    if (typeof fetch !== "function") return null;

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) return null;

    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      console.warn(`Mistral error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.warn("Mistral call failed:", e && e.message ? e.message : e);
    return null;
  }
}

/**
 * Main automation function
 * NOTE: This version no longer performs automatic PDF upload.
 * It only helps you navigate: login -> Orders -> select order -> Generate Invoice.
 * You will manually upload the PDF inside the browser.
 */
async function automateGemBillUpload() {
  log("🚀 Starting Gem Bill Upload Automation", "success");
  log("=".repeat(60));

  // Ensure screenshot directory exists
  ensureScreenshotDir();

  // Launch browser in non-headless mode (Playwright-managed Chromium).
  // Note: Playwright always uses its own browser binaries; it cannot safely
  // attach to an already-running Chrome session with your personal profile.
  // If the user prefers to open the URL in their regular system browser
  // (so they can use their normal Chrome profile), set environment variable
  // `OPEN_IN_SYSTEM_BROWSER=1` before running this script. To specify a
  // Chrome executable or profile, set `CHROME_EXECUTABLE_PATH`,
  // `CHROME_PROFILE_NAME` (e.g. "Profile 1" or "Default"), or
  // `CHROME_USER_DATA_DIR` (full path to User Data directory).
  if (process.env.OPEN_IN_SYSTEM_BROWSER === "1" || process.env.USE_SYSTEM_BROWSER === "1") {
    log("Opening GEM URL in system Chrome using user's profile (if available)...");
    const { exec, spawn } = require("child_process");

    const chromePathEnv = process.env.CHROME_EXECUTABLE_PATH;
    const profileName = process.env.CHROME_PROFILE_NAME; // e.g. 'Profile 1' or 'Default'
    const userDataDir = process.env.CHROME_USER_DATA_DIR; // full path

    // Helper to attempt launching Chrome with profile flags
    const tryLaunchChromeWithProfile = (url) => {
      // Determine chrome executable path
      const possiblePaths = [];
      if (chromePathEnv) possiblePaths.push(chromePathEnv);
      if (process.platform === "win32") {
        possiblePaths.push(
          `${process.env.PROGRAMFILES || 'C:\\Program Files'}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)'}\\Google\\Chrome\\Application\\chrome.exe`
        );
      } else if (process.platform === "darwin") {
        possiblePaths.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
      } else {
        possiblePaths.push("/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chrome");
      }

      const exists = (p) => {
        try {
          return fs.existsSync(p);
        } catch (e) {
          return false;
        }
      };

      const chosen = possiblePaths.find((p) => p && exists(p));
      if (!chosen) return false;

      const args = [];
      if (profileName) args.push(`--profile-directory=${profileName}`);
      if (userDataDir) args.push(`--user-data-dir=${userDataDir}`);
      args.push(url);

      try {
        const child = spawn(chosen, args, { detached: true, stdio: 'ignore' });
        child.unref();
        return true;
      } catch (e) {
        try {
          exec(`"${chosen}" ${args.join(' ')}`, (err) => {});
          return true;
        } catch (e2) {
          return false;
        }
      }
    };

    // If we have a profile or userDataDir, try to open Chrome with that profile
    let opened = false;
    if (profileName || userDataDir || chromePathEnv) {
      opened = tryLaunchChromeWithProfile(CONFIG.gemLoginUrl);
      if (!opened) log("Could not launch Chrome with profile flags; falling back to default open.", "info");
    }

    // Fallback: open default handler (system browser)
    if (!opened) {
      const openUrl = (url) => {
        if (process.platform === "win32") {
          exec(`start "" "${url.replace(/"/g, '\\"')}"`, (err) => {
            if (err) log(`Failed to open browser: ${err.message}`, "error");
          });
        } else if (process.platform === "darwin") {
          exec(`open "${url.replace(/"/g, '\\"')}"`, (err) => {
            if (err) log(`Failed to open browser: ${err.message}`, "error");
          });
        } else {
          exec(`xdg-open "${url.replace(/"/g, '\\"')}"`, (err) => {
            if (err) log(`Failed to open browser: ${err.message}`, "error");
          });
        }
      };

      openUrl(CONFIG.gemLoginUrl);
    }

    // Give instructions and wait for user to press Enter to continue.
    log("Opened GEM login page in your Chrome profile (or default browser).");
    log("Please complete login in Chrome and then press Enter in this terminal to continue the script's manual steps.");

    await new Promise((resolve) => {
      try {
        process.stdin.resume();
        process.stdin.once("data", () => {
          process.stdin.pause();
          resolve();
        });
      } catch (e) {
        resolve();
      }
    });

    // After user confirmation we can't control the external browser to click
    // elements. Instead, open the Orders URL in the system browser as a helper
    // and instruct the user to select an order and generate invoice manually.
    if (!opened) {
      // If we used fallback open, open Orders too
      try {
        exec && exec(`start "" "${CONFIG.gemOrdersUrl.replace(/"/g, '\\"')}"`, (err) => {});
      } catch (e) {}
    }
    log("Please select an order in Chrome and generate the invoice manually.");
    log("The automation cannot continue programmatically with an external browser. Exiting.");
    return;
  }

  log("Launching browser (non-headless mode)...");
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--disable-dev-shm-usage", "--start-maximized"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36"
  );

  // Ensure scrollbars are enabled (both vertical and horizontal) in case the site forces overflow hidden
  await page.evaluateOnNewDocument(() => {
    try {
      const enableScroll = () => {
        const html = document.documentElement;
        const body = document.body;
        if (html) {
          html.style.overflowX = "auto";
          html.style.overflowY = "auto";
        }
        if (body) {
          body.style.overflowX = "auto";
          body.style.overflowY = "auto";
        }
      };

      // Run immediately and also on DOMContentLoaded
      enableScroll();
      document.addEventListener("DOMContentLoaded", enableScroll);
    } catch (e) {
      // ignore
    }
  });

  try {
    // Step 1: Navigate to Gem login page
    log("Step 1: Navigating to Gem login page...");
    log(`URL: ${CONFIG.gemLoginUrl}`);
    await page.goto(CONFIG.gemLoginUrl, {
      waitUntil: "networkidle2",
      timeout: CONFIG.navigationTimeout,
    });
      await sleep(500);
      await sleep(1000);
    await takeScreenshot(page, "01-gem-login-page");
    log("Successfully navigated to Gem login page", "success");

    // Step 2: Wait for manual login
    log("Step 2: ⏸️  MANUAL ACTION REQUIRED - Please login manually");
    log("=".repeat(60));
    log("The browser is now open. Please:");
    log("1. Enter your username/credentials");
    log("2. Enter your password");
    log("3. Complete any CAPTCHA if required");
    log("4. Click Login/Sign In button");
    log("5. Wait for login to complete");
    log("=".repeat(60));
    log("Waiting for you to complete login...");
    log("The script will continue automatically after login is detected.");
    log("(You can also press Enter in the terminal to continue manually)");
    log("=".repeat(60));

    // Wait for user to login manually
    // Check for common post-login indicators
    let loginComplete = false;
    const maxWaitTime = CONFIG.manualWaitTimeout;
    const checkInterval = 5000; // Check every 5 seconds
    const startTime = Date.now();

    while (!loginComplete && Date.now() - startTime < maxWaitTime) {
      await sleep(checkInterval);

      // Check for common post-login indicators: both text and CSS selectors
      const loginTextIndicators = ["Logout", "Sign Out", "Signout"];
      const loginCssIndicators = ['[href*="logout"]', ".user-profile", ".user-menu", "#user-menu"];

      try {
        const bodyText = await page.evaluate(() => document.body && document.body.innerText ? document.body.innerText : "");
        for (const txt of loginTextIndicators) {
          if (bodyText && bodyText.includes(txt)) {
            log("✅ Login detected by page text! Continuing automation...", "success");
            loginComplete = true;
            break;
          }
        }
      } catch (e) {
        // ignore
      }

      if (!loginComplete) {
        for (const sel of loginCssIndicators) {
          try {
            const el = await page.$(sel);
            if (el) {
              const box = await el.boundingBox();
              if (box) {
                log(`✅ Login detected by selector ${sel}`, "success");
                loginComplete = true;
                break;
              }
            }
          } catch (e) {
            // continue
          }
        }
      }

      // Also check if URL changed (common after login)
      try {
        const currentUrl = page.url();
        if (
          currentUrl !== CONFIG.gemLoginUrl &&
          !currentUrl.includes("login") &&
          !currentUrl.includes("sso")
        ) {
          log("✅ URL changed - Login likely completed!", "success");
          loginComplete = true;
        }
      } catch (e) {}

      if (!loginComplete) {
        log("⏳ Still waiting for login... (checking every 5 seconds)");
      }
    }

    if (!loginComplete) {
      log(
        "⚠️  Login not detected automatically. Continuing anyway...",
        "error"
      );
      log("If you've logged in, the script will continue.");
    }

    await takeScreenshot(page, "02-after-login");
    await sleep(2000);

    // Step 3: Navigate to Orders tab
    log("Step 3: Navigating to Orders tab...");
    log(`URL: ${CONFIG.gemOrdersUrl}`);
    await page.goto(CONFIG.gemOrdersUrl, {
      waitUntil: "networkidle2",
      timeout: CONFIG.navigationTimeout,
    });
    await takeScreenshot(page, "03-orders-tab");
    log("Successfully navigated to Orders tab", "success");

    // Wait for Orders page to load
    // Give the page a moment to finish loading
    await sleep(3000);

    // Step 4: Wait for user to select an order manually
    log("Step 4: ⏸️  MANUAL ACTION REQUIRED - Please select an order");
    log("=".repeat(60));
    log("The Orders page is now open. Please:");
    log("1. Browse the orders list");
    log("2. Click on/select the order you want to generate invoice for");
    log("3. Wait for the order details to load");
    log("=".repeat(60));
    log("Waiting for order selection...");
    log(
      "(Press Enter in terminal when order is selected to continue immediately)"
    );
    log("=".repeat(60));

    // Wait for order selection
    // We'll wait a reasonable time for user to select order
    await sleep(10000); // Initial wait
    log("⏳ Waiting for order selection (checking every 5 seconds)...");

    // Check for order selection indicators
    let orderSelected = false;
    const orderCheckStartTime = Date.now();
    const orderCheckMaxTime = CONFIG.manualWaitTimeout;

    while (!orderSelected && Date.now() - orderCheckStartTime < orderCheckMaxTime) {
      await sleep(checkInterval);

      // Check for order details by looking for likely text or selectors
      try {
        const bodyText = await page.evaluate(() => document.body && document.body.innerText ? document.body.innerText : "");
        if (bodyText && (bodyText.includes("Generate Invoice") || bodyText.includes("Generate"))) {
          log("✅ Order selection detected by page text!", "success");
          orderSelected = true;
          break;
        }
      } catch (e) {}

      const orderCssChecks = ['[id*="generate"]', '[class*="generate"]', '.order-details', '.order-info'];
      for (const sel of orderCssChecks) {
        try {
          const el = await page.$(sel);
          if (el) {
            const box = await el.boundingBox();
            if (box) {
              log(`✅ Order selection detected by selector ${sel}`, "success");
              orderSelected = true;
              break;
            }
          }
        } catch (e) {}
      }

      if (!orderSelected) log("⏳ Still waiting for order selection...");
    }

    await takeScreenshot(page, "04-order-selected");

    // Step 5: Click "Generate Invoice" button
    log("Step 5: Looking for 'Generate Invoice' button...");

    const generateInvoiceSelectors = [
      'button[id*="generate"]',
      'button[class*="generate"]',
      '[id*="generate-invoice"]',
      '[class*="generate-invoice"]',
      ".generate-invoice-btn",
      "#generate-invoice-btn",
    ];

    let generateButtonFound = false;
    let generateButtonSelector = null;

    // Try to find generate button by text (preferred) or by selector
    const textCandidates = ["Generate Invoice", "Generate", "Invoice"];
    for (const txt of textCandidates) {
      try {
        const xpathButton = `//button[contains(normalize-space(.), "${txt}")]`;
        const handles = await page.$x(xpathButton);
        if (handles && handles.length > 0) {
          generateButtonFound = true;
          generateButtonSelector = handles[0];
          log(`Found 'Generate Invoice' button by text: ${txt}`);
          break;
        }
        const xpathLink = `//a[contains(normalize-space(.), "${txt}")]`;
        const linkHandles = await page.$x(xpathLink);
        if (linkHandles && linkHandles.length > 0) {
          generateButtonFound = true;
          generateButtonSelector = linkHandles[0];
          log(`Found 'Generate Invoice' link by text: ${txt}`);
          break;
        }
      } catch (e) {}
    }

    if (!generateButtonFound) {
      for (const selector of generateInvoiceSelectors) {
        try {
          const el = await page.$(selector);
          if (el) {
            const box = await el.boundingBox();
            if (box) {
              generateButtonFound = true;
              generateButtonSelector = selector;
              log(`Found 'Generate Invoice' button with selector: ${selector}`);
              break;
            }
          }
        } catch (e) {}
      }
    }

    if (!generateButtonFound) {
      log("⚠️  'Generate Invoice' button not found automatically.", "error");
      log(
        "Please click 'Generate Invoice' manually, then press Enter to continue..."
      );
      // Wait a bit more for manual click
      await sleep(5000);
    } else {
      log("Clicking 'Generate Invoice' button...");
      try {
        if (typeof generateButtonSelector === "string") {
          await safeClick(page, generateButtonSelector, "Generate Invoice Button");
        } else if (generateButtonSelector && typeof generateButtonSelector.click === "function") {
          await generateButtonSelector.click();
        } else if (generateButtonSelector && generateButtonSelector.asElement) {
          const el = generateButtonSelector.asElement ? generateButtonSelector.asElement() : generateButtonSelector;
          if (el && typeof el.click === "function") await el.click();
        }
        log("✅ Successfully clicked 'Generate Invoice' button", "success");
      } catch (e) {
        log("⚠️  Failed to click button. Please click manually.", "error");
      }
    }

    // Wait for invoice generation page/modal to appear
    log("Waiting for invoice generation page/modal to load...");
    await sleep(5000);
    await sleep(1000);
    await takeScreenshot(page, "05-invoice-generation-page");

    // Step 6.1: Try to auto-fill Invoice Details fields using direct DOM access
    log("Step 6.1: Trying to auto-fill Invoice Details fields...", "info");
    try {
      const invoiceNo = BILL_META.invoiceNo || "";
      const gstinValue = BILL_META.gstin || "27AAACR2831H1ZK";

      // Wait for the form elements to exist in the DOM
      await page.waitForSelector(
        "#SERVICE_INVOICE_CREATION_FORM1-SELL_INVOICE_NO, #SERVICE_INVOICE_CREATION_FORM1-GSTIN",
        { timeout: 20000 }
      );

      await page.evaluate(
        (meta) => {
          const { invoiceNo, gstinValue } = meta;

          const setValueAndDispatch = (id, value) => {
            const el = document.getElementById(id);
            if (!el) return;

            el.focus();
            el.value = value;
            // Fire common events so Gem's JS picks up the change
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
            el.dispatchEvent(new Event("blur", { bubbles: true }));
          };

          if (invoiceNo) {
            setValueAndDispatch(
              "SERVICE_INVOICE_CREATION_FORM1-SELL_INVOICE_NO",
              invoiceNo
            );
          }

          setValueAndDispatch(
            "SERVICE_INVOICE_CREATION_FORM1-GSTIN",
            gstinValue
          );
        },
        { invoiceNo, gstinValue }
      );

      log(
        `Auto-filled Invoice Details via DOM: invoiceNo="${invoiceNo}", gstin="${gstinValue}"`,
        "success"
      );
    } catch (e) {
      log(
        `Could not auto-fill Invoice Details fields; continuing without it. Reason: ${e.message}`,
        "info"
      );
    }

    // Step 6: Find "Upload Document / Bill" section
    log("Step 6: Looking for 'Upload Document / Bill' section...");

    // First, try to find the section by text
    const uploadSectionSelectors = [
      '[id*="upload-document"]',
      '[id*="upload-bill"]',
      '[class*="upload-document"]',
      '[class*="upload-bill"]',
      ".upload-section",
      "#upload-section",
    ];

    // Scroll to find upload section
    log("Scrolling page to find upload section...");
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await sleep(2000);

    // Scroll back up gradually
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await sleep(1000);

    // Step 7–10 (automatic file upload) removed.
    // From here, the user will manually upload the PDF via Gem UI.
    log("Step 7: Manual upload phase", "info");
    log("=".repeat(60));
    log("Automation steps completed:");
    log("1. Logged in (after your manual login).");
    log("2. Opened Orders tab.");
    log("3. Waited for you to select an order.");
    log("4. Clicked 'Generate Invoice'.");
    log(
      "Now you can manually upload the PDF in the 'Upload Document / Bill' section.",
      "info"
    );
    log("The browser will remain open for you to finish the upload manually.");
    log("=".repeat(60));

    // Keep browser open for user to finish manual steps
    await sleep(300000); // 5 minutes
  } catch (error) {
    log(`❌ Error during automation: ${error.message}`, "error");
    log(`Stack trace: ${error.stack}`, "error");
    await takeScreenshot(page, "error-screenshot");

    // Keep browser open on error so user can see what happened
    log("Keeping browser open for 30 seconds to investigate error...");
    await sleep(30000);
  } finally {
    // Close browser
    log("Closing browser...");
    await browser.close();
    log("Browser closed.", "success");
  }
}

// Small helper to sleep without relying on Puppeteer page API
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main execution
 */
async function main() {
  log("Gem Bill Upload Automation Script", "success");
  log("=".repeat(60));
  log("This script will:");
  log("1. Open Gem login page (manual login required)");
  log("2. Navigate to Orders tab");
  log("3. Wait for you to select an order");
  log("4. Click 'Generate Invoice' button");
  log("=".repeat(60));
  log(`Gem Login URL: ${CONFIG.gemLoginUrl}`);
  log(`Gem Orders URL: ${CONFIG.gemOrdersUrl}`);
  log("=".repeat(60));

  // Optional AI analysis before running automation (non-blocking)
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && typeof fetch === "function") {
      try {
        await runAIAnalysis(BILL_META);
      } catch (e) {
        log("AI analysis failed (continuing without it)", "error");
      }
    }
  } catch (e) {
    // ignore
  }

  // Run automation (no file path needed anymore)
  await automateGemBillUpload();
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

module.exports = { automateGemBillUpload };
