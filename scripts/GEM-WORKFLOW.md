# Gem Bill Upload Workflow

This document explains the automated workflow for uploading bills to the Gem portal.

## Workflow Steps

### 1. **Manual Login** ⏸️
- Script opens the Gem login page: `https://sso.gem.gov.in/ARXSSO/oauth/doLogin`
- **YOU** need to manually:
  - Enter your username/credentials
  - Enter your password
  - Complete any CAPTCHA if required
  - Click Login/Sign In
- Script automatically detects when login is complete

### 2. **Navigate to Orders Tab** ✅
- Script automatically navigates to: `https://fulfilment.gem.gov.in/fulfilment/home#WORKSPACE_ID=ORDERS_WS`
- Orders page loads automatically

### 3. **Select Order** ⏸️
- **YOU** need to manually:
  - Browse the orders list
  - Click on/select the order you want to generate invoice for
  - Wait for order details to load
- Script detects when order is selected (by looking for "Generate Invoice" button)

### 4. **Generate Invoice** ✅
- Script automatically finds and clicks the "Generate Invoice" button
- Waits for invoice generation page/modal to appear

### 5. **Upload PDF Bill** ✅
- Script automatically finds the "Upload Document / Bill" section
- Uploads your PDF bill file
- Verifies upload completion

## Usage

```bash
# Run with PDF bill file
npm run gem-upload ./path/to/your-bill.pdf

# Example
npm run gem-upload ./bills/invoice-001.pdf
```

## Requirements

- PDF file format (`.pdf` extension)
- Valid Gem portal credentials
- Internet connection

## What You Need to Do Manually

1. **Login** - Enter credentials and complete CAPTCHA if required
2. **Select Order** - Choose the order from the list

## What the Script Does Automatically

1. ✅ Opens browser and navigates to login page
2. ✅ Detects when login is complete
3. ✅ Navigates to Orders tab
4. ✅ Detects when order is selected
5. ✅ Clicks "Generate Invoice" button
6. ✅ Finds "Upload Document / Bill" section
7. ✅ Uploads PDF bill file
8. ✅ Takes screenshots at each step

## Screenshots

Screenshots are saved to `./screenshots/` folder:
- `01-gem-login-page-*.png` - Login page
- `02-after-login-*.png` - After login
- `03-orders-tab-*.png` - Orders tab
- `04-order-selected-*.png` - Order selected
- `05-invoice-generation-page-*.png` - Invoice generation page
- `06-file-input-found-*.png` - File input found
- `07-file-uploaded-*.png` - File uploaded
- `09-upload-complete-*.png` - Upload complete

## Troubleshooting

### Login not detected
- Make sure you've successfully logged in
- Check if URL changed from login page
- Script will continue after 5 minutes even if not detected

### Order selection not detected
- Make sure you've clicked on an order
- Order details should be visible
- Script will continue after 5 minutes even if not detected

### File upload not found
- Check if "Upload Document / Bill" section is visible
- Scroll down if needed
- Script will try multiple selectors

### PDF upload fails
- Verify file is actually a PDF
- Check file size (should be reasonable)
- Check browser console for errors

## Notes

- Script runs in **non-headless mode** - you can see everything
- Script waits up to **5 minutes** for manual actions
- All actions are logged to console
- Screenshots help debug issues


