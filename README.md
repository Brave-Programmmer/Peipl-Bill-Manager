# PEIPL Bill Assistant

A professional bill generation application for Pujari Engineers India Pvt Ltd, available as both a web application and desktop application with advanced file management capabilities.

## ✨ Features

- **Professional Bill Generation**: Create detailed bills with CGST/SGST calculations
- **Customer Management**: Save and load customer presets
- **Company Information**: Editable company details with logo
- **Multiple Export Formats**: PDF, JSON, and CSV export options
- **Desktop Application**: Native desktop app with file system integration
- **File Association**: Default handler for JSON files in Windows
- **Print Support**: Direct printing with A4 formatting
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Beautiful dashboard with quick actions
- **Notification System**: Real-time feedback for all operations

## 🚀 Installation

Run

```
npx electron-builder
```

## 📖 Usage

### Web Application

1. **Create a Bill**:

   - Fill in company information
   - Add customer details
   - Add items with quantities, rates, and GST
   - Click "Generate Bill" in the Quick Actions dashboard

2. **Save Bills**:

   - Use the "Save Bill" button to download as JSON
   - Bills are also saved locally in the browser

3. **Load Bills**:
   - Use the "Open Bill" button to load JSON files
   - Previously saved bills appear in the saved bills section

### Desktop Application

1. **File Menu**:

   - **Open Bill** (Ctrl+O): Open a JSON bill file
   - **Save Bill As...** (Ctrl+S): Save current bill as JSON
   - **Exit**: Close the application

2. **Quick Actions Dashboard**:

   - **Generate Bill**: Create and preview bills
   - **Open Bill**: Load existing JSON files
   - **Save Bill**: Save current bill as JSON
   - **Export & Print**: Access PDF and print options

3. **File Association**:

   - Double-click any JSON file to open it directly in the app
   - Right-click JSON files → "Open with" → "PEIPL Bill Assistant"

4. **Additional Features**:
   - Native file system integration
   - Menu shortcuts
   - Professional desktop interface
   - Real-time notifications

## 🎨 UI Improvements

### Modern Dashboard

- **Quick Actions Panel**: Centralized access to all main functions
- **Visual Feedback**: Hover effects, animations, and loading states
- **Responsive Grid**: Adapts to different screen sizes
- **Color-coded Actions**: Different colors for different types of actions

### Notification System

- **Real-time Feedback**: Success, error, and warning notifications
- **Auto-dismiss**: Notifications disappear after 5 seconds
- **Manual Control**: Click × to dismiss immediately
- **Positioned**: Top-right corner, non-intrusive

### Enhanced User Experience

- **Loading States**: Visual feedback during operations
- **Error Handling**: Graceful error messages
- **Desktop Detection**: Shows desktop-specific features only when available
- **File Association Status**: Indicates when desktop app is active

## 📁 File Formats

### JSON Format

Bills are saved in JSON format for easy editing and programmatic access:

```json
{
  "billNumber": "INV-001",
  "date": "2025-01-15",
  "customerName": "Customer Name",
  "plantName": "Plant Name",
  "customerAddress": "Address",
  "customerGST": "GSTIN",
  "items": [
    {
      "id": 1,
      "description": "Service Description",
      "sacHsn": "SAC/HSN Code",
      "quantity": 1,
      "rate": 1000,
      "amount": 1000,
      "cgstRate": 9,
      "cgstAmount": 90,
      "sgstRate": 9,
      "sgstAmount": 90,
      "totalWithGST": 1180,
      "dates": ["2025-01-15"]
    }
  ],
  "companyInfo": {
    "name": "PUJARI ENGINEERS INDIA (P) LTD.",
    "services": "Services offered",
    "address": "Company address",
    "phone": "Phone number",
    "email": "Email address",
    "gst": "GSTIN",
    "pan": "PAN"
  }
}
```

### PDF Export

- High-quality PDF generation
- A4 page format
- Professional layout
- Print-ready format

### CSV Export

- Tabular data export
- Compatible with spreadsheet applications
- Includes all item details

## 🔧 Development

### Project Structure

```
peipl/
├── src/
│   ├── app/
│   │   ├── page.js          # Main application page
│   │   └── globals.css      # Global styles
│   └── components/
│       ├── Header.js        # Application header
│       ├── CompanyInfo.js   # Company information component
│       ├── CustomerInfo.js  # Customer details component
│       ├── ItemsTable.js    # Items table component
│       ├── Totals.js        # Totals calculation component
│       ├── BillGenerator.js # Bill generation and export
│       ├── SplashScreen.js  # Loading screen
│       ├── LoadingSpinner.js # Loading indicator
│       └── CredentialManager.js # Save functionality
├── electron/
│   ├── main.js             # Electron main process
│   └── preload.js          # Electron preload script
├── public/
│   ├── logo.png            # Company logo
│   └── stamp.png           # Digital stamp
├── setup-windows.reg       # Windows file association setup
└── package.json            # Dependencies and scripts
```

### Available Scripts

- `npm run dev`: Start development server
- `npm run dev:turbo`: Start development server with Turbopack
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run electron`: Run desktop app
- `npm run electron-dev`: Run desktop app in development
- `npm run dist`: Build desktop app for distribution
- `npm run lint`: Run linter
- `npm run format`: Format code

## 🛠 Technologies Used

- **Frontend**: Next.js 15, React 19
- **Styling**: Tailwind CSS 4
- **Desktop**: Electron
- **PDF Generation**: html2canvas, jsPDF
- **Build Tool**: Turbopack
- **Linting**: Biome

## 🌐 Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## 💻 Desktop Support

- **Windows 10/11**: Full support with file association
- **macOS 10.15+**: Full support
- **Linux (Ubuntu 18.04+, CentOS 7+)**: Full support

## 📋 Bill Format

The application generates bills with the following structure:

- **Header**: Company logo, name, services, and contact information
- **Invoice Details**: Invoice number, date, order details, GSTIN
- **Customer Information**: Name, plant, address, GSTIN
- **Items Table**:
  - Sr. No. & Date
  - Ref No.
  - Job Description
  - SAC/HSN
  - Qty
  - Rate
  - Taxable Value
  - CGST Rate & Amount (9%)
  - SGST Rate & Amount (9%)
  - Total with GST
- **Totals**: Subtotal, CGST, SGST, and Grand Total
- **Payment Information**: Payment terms and instructions
- **Stamping Section**: Digital signature and stamp

## 🔒 License

This project is proprietary software for Pujari Engineers India Pvt Ltd.

## 🆘 Support

For technical support or feature requests, please contact the development team.

## 🎯 What's New

### Version 2.0

- ✅ **Desktop App**: Full native desktop application
- ✅ **File Association**: Default JSON handler for Windows
- ✅ **Modern UI**: Redesigned dashboard with quick actions
- ✅ **Notification System**: Real-time feedback
- ✅ **Enhanced UX**: Better error handling and loading states
- ✅ **Command Line Support**: Open files directly from command line
- ✅ **Cross-Platform**: Windows, macOS, and Linux support
