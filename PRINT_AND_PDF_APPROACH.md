# Print and PDF Export Approach

## ⚠️ CURRENT ARCHITECTURE: A Stabilized Workaround

This document explains the **current** print/PDF implementation, its fundamental weaknesses, and the **recommended proper architecture** for Electron apps.

### The Core Problem

The current approach attempts to **serialize a live React/Tailwind application into static HTML** every time the user prints:

```text
❌ CURRENT (Workaround)
React DOM → Extract HTML → Extract CSS → Build HTML Blob → Temp File → Hidden Window → Print
```

Instead of the proper pattern:

```text
✅ PROPER (Recommended)
Dedicated Print Route → Load Invoice Data → React Renders Normally → Print
```

---

## Current Implementation (What We Have Now)

### Architecture

```
Main Window (React App)
    ↓
User clicks "Print" or "Save PDF"
    ↓
Capture DOM: document.querySelector('[data-invoice-print]')
    ↓
Extract CSS: Array.from(document.styleSheets).cssRules
    ↓
Create static HTML blob with embedded CSS
    ↓
Write to temp file: /temp/invoice-print-{timestamp}.html
    ↓
Create hidden BrowserWindow
    ↓
Load file:// URL
    ↓
Wait 1 second (setTimeout) ⚠️
    ↓
webContents.print() or webContents.printToPDF()
    ↓
Close window, cleanup temp file
```

### Files Involved

- **Frontend**: `src/components/PrintPreview.tsx` - DOM capture + CSS extraction
- **IPC Bridge**: `src/electron/preload.cjs` - Exposes `printInvoice()` and `savePDF()`
- **Backend**: `src/electron/main.js` - Handlers create temp files and hidden windows

---

## Fundamental Problems with Current Approach

### 1. ❌ CSS Extraction Is Inherently Fragile

```typescript
for (let i = 0; i < document.styleSheets.length; i++) {
  try {
    const sheet = document.styleSheets[i];
    if (sheet.cssRules) {
      for (let j = 0; j < sheet.cssRules.length; j++) {
        styles += sheet.cssRules[j].cssText + '\n';
      }
    }
  } catch (e) {
    // ⚠️ Already compensating for failures
    console.warn('Could not access stylesheet:', e);
  }
}
```

**Fails when:**
- Tailwind injects runtime styles
- Stylesheets are cross-origin
- Content Security Policy blocks access
- Fonts are lazy-loaded
- CSS order matters
- Vite HMR injects dev styles
- Media queries or CSS custom properties behave differently

**Current "solution"**: `try-catch` - which just masks failures.

### 2. ❌ You're Printing a Snapshot, Not the Real App

The printed document is dead HTML:

```html
<style>ENTIRE APPLICATION CSS BLOB</style>
<div>static html snapshot</div>
```

Consequences:
- No React lifecycle hooks
- No dynamic layout corrections
- No async asset loading
- No guaranteed font readiness
- Race conditions between DOM rendering and print

**Current "solution"**: `setTimeout(..., 1000)` - a magic number that works "most of the time"

### 3. ❌ `setTimeout(1000)` Is a Red Flag

This is **not deterministic** and masks race conditions:

| Scenario | Problem |
|----------|---------|
| Fast PC | renders in 500ms → works |
| Slow PC | renders in 1500ms → blank print |
| Battery saver | GPU throttled → slow render |
| Heavy invoice | more CSS → timeout insufficient |

The timeout exists because the architecture fundamentally doesn't wait for true readiness.

### 4. ❌ Massive CSS Payloads

Every print embeds the entire application's CSS:

```html
<style>
  /* Entire Tailwind + App CSS (~100KB+) */
</style>
```

Impact:
- Slower load times
- Memory spikes
- Slower PDF generation
- Duplicated CSS parsing per print
- Unnecessary Electron renderer overhead
- Batch printing becomes expensive

### 5. ❌ Temp File System Dependency

Adds OS-level failure points:

- Filesystem permissions issues
- Temp directory unavailable
- File locked by antivirus
- Cleanup failures → stale files accumulate
- Windows Defender scans cause delays

It works, but adds unnecessary complexity.

### 6. ❌ Hidden BrowserWindow Overhead

Every print operation:

1. Spawns Chromium renderer process
2. Allocates GPU context
3. Parses HTML
4. Parses entire CSS blob
5. Renders layout engine
6. Destroys renderer

This is expensive for repeated operations. Especially problematic for batch printing.

### 7. ❌ Asset Loading Guarantees Missing

As noted in current code:

```text
⚠️ Images (only if data URIs or same-origin)
⚠️ Fonts may not load
```

Happens because:
- Assets aren't embedded properly
- Fonts may not finish loading
- Relative paths break in temp files
- No mechanism to wait for asset readiness

### 8. ❌ Legacy Code Smell

```text
src/pages/PrintExport.tsx (Legacy - not used now)
```

This file exists because the architecture evolved through workaround layers instead of a clean design from the start.

---

## ✅ The Proper Electron Architecture

Instead of serializing React into HTML, **let React render normally in a dedicated window**:

### Proper Flow

```
Main Window
    ↓
User clicks "Print"
    ↓
Open hidden window with:
  loadURL(`http://localhost:5173/print/${invoiceId}`)
  or: loadURL(`file://dist/index.html#/print/${invoiceId}`)
    ↓
Print Route Loads (React component)
    ↓
Fetch invoice data via IPC:
  const invoice = await window.electron.getInvoice(invoiceId)
    ↓
React renders <InvoiceTemplate invoice={invoice} />
    ↓
Wait for true readiness:
  - document.fonts.ready
  - all images loaded
  - custom animation complete
    ↓
webContents.print() or webContents.printToPDF()
    ↓
Close window
```

### Key Advantages

| Aspect | Benefit |
|--------|---------|
| **No CSS extraction** | Tailwind works normally |
| **No DOM cloning** | Real React rendering |
| **No temp files** | No filesystem dependency |
| **Fonts work** | CSS loads properly |
| **Images work** | Asset loading guaranteed |
| **Deterministic** | No magic timeouts |
| **Reliable** | Uses proper readiness APIs |
| **Maintainable** | Same code, different route |
| **Scalable** | Batch printing efficient |

---

## Implementation: How to Do It Right

### Step 1: Create Print Route

```tsx
// src/pages/PrintPage.tsx
import React, { useEffect, useState } from 'react';
import { IndustrialInvoice } from '../templates/IndustrialInvoice';
import type { Invoice, CompanyDetails } from '../utils/types';

export const PrintPage: React.FC = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Get invoice ID from URL params
    const params = new URLSearchParams(window.location.search);
    const invoiceId = params.get('id');

    // Fetch from main process
    window.electron?.getInvoice(invoiceId).then((invoice) => {
      setData(invoice);
    });
  }, []);

  if (!data) {
    return <div>Loading invoice...</div>;
  }

  return (
    <div className="p-[5mm] bg-white">
      <IndustrialInvoice invoice={data.invoice} company={data.company} />
    </div>
  );
};
```

### Step 2: Add Router Entry

```tsx
// src/App.tsx or routing config
{
  path: '/print',
  element: <PrintPage />,
}
```

### Step 3: Update Electron IPC

```javascript
// src/electron/preload.cjs
getInvoice: (id) => ipcRenderer.invoke('get-invoice', id),
```

```javascript
// src/electron/main.js
// Store current invoice data globally (set when print/pdf requested)
let invoiceToPreview = null;

ipcMain.handle('print-request', async (event, invoiceData) => {
  invoiceToPreview = invoiceData;
  
  const printWin = new BrowserWindow({
    show: false,
    webPreferences: { preload: ... }
  });

  const url = isDev
    ? 'http://localhost:5173/print'
    : `file://${path.join(__dirname, '../../dist/index.html')}#/print`;

  return new Promise((resolve, reject) => {
    printWin.webContents.once('did-finish-load', async () => {
      try {
        // Wait for true readiness
        await printWin.webContents.executeJavaScript(`
          new Promise(async (resolve) => {
            await document.fonts.ready;
            const images = Array.from(document.images);
            await Promise.all(images.map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise(r => {
                img.onload = r;
                img.onerror = r;
              });
            }));
            resolve();
          });
        `);

        // Now safe to print
        printWin.webContents.print({
          silent: false,
          printBackground: true
        }, (success) => {
          printWin.close();
          resolve(success);
        });
      } catch (err) {
        printWin.close();
        reject(err);
      }
    });

    printWin.loadURL(url);
  });
});

ipcMain.handle('get-invoice', async (event, id) => {
  return invoiceToPreview;
});
```

### Step 4: Update Print Button

```typescript
// src/components/PrintPreview.tsx
const handlePrint = async () => {
  try {
    setIsLoading(true);
    await window.electron?.printRequest({
      invoice: invoice,
      company: company
    });
  } catch (err) {
    setError('Print failed');
  } finally {
    setIsLoading(false);
  }
};
```

---

## Comparison: Current vs. Proper

| Aspect | Current (Workaround) | Proper (Recommended) |
|--------|---------------------|---------------------|
| CSS extraction | ❌ Fragile try-catch | ✅ Normal Tailwind |
| Asset loading | ⚠️ May fail | ✅ Guaranteed |
| Font readiness | ⚠️ setTimeout(1000) | ✅ document.fonts.ready |
| Image loading | ⚠️ No guarantees | ✅ imagePromises |
| Temp files | ⚠️ Filesystem dependency | ✅ None |
| DOM cloning | ❌ Serialization overhead | ✅ Native rendering |
| Memory usage | ❌ High (CSS blob) | ✅ Normal |
| Performance | ❌ Slow per print | ✅ Fast |
| Code maintainability | ❌ Complex extraction logic | ✅ Simple route |
| Deterministic | ❌ Race conditions | ✅ Proper API usage |
| Batch printing | ❌ Per-print overhead | ✅ Efficient |

---

## Why Current Approach Still Works

Despite fundamental issues, it works because:

1. **file:// protocol is reliable** - Chromium handles local files well
2. **Static HTML renders predictably** - No dynamic changes
3. **Modern hardware is fast** - Most machines render in < 1 second
4. **Simple cases don't fail** - Simple invoices render quickly

**But it's still a workaround.** The timeout and try-catch are proof.

---

## Migration Path

### Phase 1: Add Print Route
- Create `/print` route
- Keep current system working
- Both systems run in parallel

### Phase 2: Implement Proper IPC
- Add `getInvoice` handler
- Update print components
- Test new approach

### Phase 3: Remove Old System
- Delete CSS extraction code
- Delete temp file logic
- Delete hidden window workarounds
- Delete setTimeout magic

### Phase 4: Cleanup
- Remove unused components
- Remove PrintExport.tsx
- Update documentation

---

## Key Takeaways

### What You Have Now
A **stabilized workaround** that works well enough but carries architectural debt:
- CSS extraction via try-catch
- Magic timeouts instead of proper readiness
- Temp file dependencies
- DOM serialization instead of real rendering

### What You Should Have
A **proper Electron pattern**:
- Dedicated print route that React renders normally
- Pass only invoice ID via IPC
- Use proper APIs: `document.fonts.ready`, image load promises
- No CSS extraction, no temp files, no timeouts

### Bottom Line
The current solution is **technically valid** for a small Electron app but represents **architectural debt**. The proper approach is simpler, more reliable, and more maintainable.

---

## Related Documentation

- [Electron webContents.print()](https://www.electronjs.org/docs/api/web-contents#contentsprintfunction-callback)
- [Electron webContents.printToPDF()](https://www.electronjs.org/docs/api/web-contents#contentspdftoprintoptions)
- [CSS Fonts Loading API](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/ready)
- [Image Loading Promises](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/complete)
