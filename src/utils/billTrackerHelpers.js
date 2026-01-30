/**
 * Helper utilities for Bill Folder Tracker
 * Extracted for better maintainability and reusability
 */

const MONTH_NAMES = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

/**
 * Format bytes to human-readable file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

/**
 * Format date to locale string
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    console.warn("Error formatting date:", dateString);
    return "-";
  }
};

/**
 * Format month key (YYYY-MM) to readable format
 * @param {string} monthKey - Month in YYYY-MM format
 * @returns {string} Formatted month
 */
export const formatMonth = (monthKey) => {
  if (!monthKey) return "-";
  try {
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    console.warn("Error formatting month:", monthKey);
    return "-";
  }
};

/**
 * Get file icon emoji based on extension
 * @param {string} ext - File extension
 * @returns {string} Icon emoji
 */
export const getFileIcon = (ext) => {
  const icons = {
    ".pdf": "📄",
    ".doc": "📝",
    ".docx": "📝",
    ".jpg": "🖼️",
    ".jpeg": "🖼️",
    ".json": "📋",
    ".peiplbill": "🧾",
    ".peipl": "🧾",
  };
  return icons[ext] || "📄";
};

/**
 * Get file color classes based on extension
 * @param {string} ext - File extension
 * @returns {string} Tailwind CSS classes
 */
export const getFileColor = (ext) => {
  const colors = {
    ".pdf": "bg-red-100 text-red-700 border-red-200",
    ".doc": "bg-blue-100 text-blue-700 border-blue-200",
    ".docx": "bg-blue-100 text-blue-700 border-blue-200",
    ".jpg": "bg-purple-100 text-purple-700 border-purple-200",
    ".jpeg": "bg-purple-100 text-purple-700 border-purple-200",
    ".json": "bg-yellow-100 text-yellow-700 border-yellow-200",
    ".peiplbill": "bg-green-100 text-green-700 border-green-200",
    ".peipl": "bg-green-100 text-green-700 border-green-200",
  };
  return colors[ext] || "bg-gray-100 text-gray-700 border-gray-200";
};

/**
 * Get financial year from date string
 * @param {string} dateString - Date to convert
 * @returns {string} Financial year in YYYY-YY format
 */
export const getFinancialYear = (dateString) => {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      console.warn("Invalid date for financial year:", dateString);
      return null;
    }
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return month < 4
      ? `${year - 1}-${String(year).slice(-2)}`
      : `${year}-${String(year + 1).slice(-2)}`;
  } catch (e) {
    console.warn("Error calculating financial year:", dateString);
    return null;
  }
};

/**
 * Get bill month with fallback logic
 * @param {string|Date} fileCreatedDate - File creation date
 * @param {string|Date} fileModifiedDate - File modified date
 * @returns {string} Month in YYYY-MM format
 */
export const getBillMonth = (fileCreatedDate = null, fileModifiedDate = null) => {
  const dateToUse = fileCreatedDate || fileModifiedDate;
  
  if (dateToUse) {
    try {
      const date = new Date(dateToUse);
      if (!Number.isNaN(date.getTime())) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }
    } catch (e) {
      console.warn("Error parsing date for bill month:", dateToUse);
    }
  }

  // Fallback to previous month if no valid date
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Get current month in YYYY-MM format
 * @returns {string} Current month
 */
export const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Calculate GST folder structure paths
 * @param {string} sentMonth - Month of submission in YYYY-MM format
 * @param {string} billMonth - Billing month in YYYY-MM format
 * @returns {object} Object containing yearFolderName and submissionFolderName
 */
export const calculateGstFolderStructure = (sentMonth, billMonth) => {
  if (!sentMonth || !billMonth) {
    throw new Error("sentMonth and billMonth are required");
  }

  const [sentYear, sentMonthNum] = sentMonth.split("-");
  const sentYearNum = parseInt(sentYear, 10);

  // Financial year starts in April
  let financialYearStart = sentYearNum;
  if (parseInt(sentMonthNum, 10) < 4) {
    financialYearStart = sentYearNum - 1;
  }
  const financialYearEnd = financialYearStart + 1;
  const yearFolderName = `${financialYearStart}-${String(financialYearEnd).slice(-2)}`;

  const [billYear, billMonthNum] = billMonth.split("-");
  const billMonthName = MONTH_NAMES[parseInt(billMonthNum, 10) - 1];
  const sentMonthName = MONTH_NAMES[parseInt(sentMonthNum, 10) - 1];

  const submissionFolderName = `${billMonthName} ${billYear} BILLS SUBMITTED IN ${sentMonthName} ${sentYear}`;

  return { yearFolderName, submissionFolderName };
};

/**
 * Validate date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {object} Validation result with isValid and error message
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return { isValid: true, error: null };
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { isValid: false, error: "Invalid date format" };
    }

    if (start > end) {
      return { isValid: false, error: "Start date cannot be after end date" };
    }

    return { isValid: true, error: null };
  } catch (e) {
    return { isValid: false, error: "Date validation error" };
  }
};

/**
 * Validate file size input
 * @param {string} value - Input value
 * @param {number} otherSize - Size to compare with (for min/max validation)
 * @param {string} type - Type of validation: 'min' or 'max'
 * @returns {object} Validation result with isValid, error, and bytes
 */
export const validateFileSize = (value, otherSize = null, type = "min") => {
  if (value === "") {
    return { isValid: true, error: null, bytes: type === "min" ? 0 : Infinity };
  }

  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return {
      isValid: false,
      error: `${type === "min" ? "Minimum" : "Maximum"} size must be a number`,
      bytes: null,
    };
  }

  if (type === "min" && numeric < 0) {
    return {
      isValid: false,
      error: "Minimum size must be non-negative",
      bytes: null,
    };
  }

  if (type === "max" && numeric <= 0) {
    return {
      isValid: false,
      error: "Maximum size must be positive",
      bytes: null,
    };
  }

  const multiplier = type === "min" ? 1024 : 1024 * 1024;
  const bytes = numeric * multiplier;

  if (
    otherSize !== null &&
    ((type === "min" && bytes > otherSize) || (type === "max" && bytes < otherSize))
  ) {
    return {
      isValid: false,
      error: `${type === "min" ? "Minimum" : "Maximum"} size cannot be ${type === "min" ? "greater" : "less"} than ${type === "min" ? "maximum" : "minimum"} size`,
      bytes: null,
    };
  }

  return { isValid: true, error: null, bytes };
};

/**
 * Parse manual subfolder input
 * @param {string} input - User input string
 * @returns {object} Result with isValid, paths array, and error message
 */
export const parseManualSubfolders = (input) => {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      paths: [],
      error: "No subfolders provided",
    };
  }

  try {
    let paths;
    if (input.trim().startsWith("[")) {
      paths = JSON.parse(input);
    } else {
      paths = input
        .split("\n")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    }

    if (!Array.isArray(paths) || paths.length === 0) {
      return {
        isValid: false,
        paths: [],
        error: "No valid paths found",
      };
    }

    return {
      isValid: true,
      paths: paths,
      error: null,
    };
  } catch (e) {
    return {
      isValid: false,
      paths: [],
      error: "Invalid format. Use newline-separated paths or valid JSON array",
    };
  }
};

/**
 * Get file extension from filename
 * @param {string} fileName - File name
 * @returns {string} File extension in lowercase
 */
export const getFileExtension = (fileName) => {
  if (!fileName) return "";
  return fileName.split(".").pop().toLowerCase();
};

/**
 * Get file name without extension
 * @param {string} fileName - File name
 * @returns {string} File name without extension
 */
export const getFileNameWithoutExt = (fileName) => {
  if (!fileName) return "";
  return fileName.split(".").slice(0, -1).join(".");
};

/**
 * Check if file type is allowed
 * @param {string} fileName - File name
 * @param {array} allowedTypes - Allowed file extensions
 * @returns {boolean} True if file type is allowed
 */
export const isFileTypeAllowed = (fileName, allowedTypes = ["pdf", "jpg", "png", "xlsx"]) => {
  const ext = getFileExtension(fileName).toLowerCase();
  return allowedTypes.includes(ext);
};

/**
 * Humanize time difference
 * @param {Date|string} date - Date to compare with now
 * @returns {string} Human-readable time difference
 */
export const humanizeTimeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now - past) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
};

/**
 * Generate unique ID for operations
 * @returns {string} Unique ID
 */
export const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/**
 * Check if two dates are in same month
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if dates are in same month
 */
export const isSameMonth = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
};

/**
 * Get bills status summary
 * @param {object} trackingData - Tracking data object
 * @returns {object} Status summary with counts
 */
export const getBillStatusSummary = (trackingData = {}) => {
  let sent = 0;
  let pending = 0;
  let overdue = 0;

  Object.values(trackingData).forEach((bill) => {
    if (bill.sentMonth) {
      sent++;
    } else {
      pending++;
      if (bill.billMonth && isOverdue(bill.billMonth)) {
        overdue++;
      }
    }
  });

  return {
    sent,
    pending,
    overdue,
    total: sent + pending,
    sentPercentage: sent + pending > 0 ? Math.round((sent / (sent + pending)) * 100) : 0,
  };
};

/**
 * Check if a bill is overdue for submission
 * @param {string} billMonth - Bill month in format YYYY-MM
 * @returns {boolean} True if bill is overdue
 */
export const isOverdue = (billMonth) => {
  if (!billMonth) return false;
  const billDate = new Date(billMonth);
  const submissionDeadline = new Date(billDate.getFullYear(), billDate.getMonth() + 1, 15);
  return new Date() > submissionDeadline;
};

/**
 * Format bill month for display
 * @param {string} monthKey - Month key in format YYYY-MM
 * @returns {string} Formatted month
 */
export const formatBillMonth = (monthKey) => {
  if (!monthKey) return "-";
  try {
    const [year, month] = monthKey.split("-");
    return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
  } catch (e) {
    return monthKey;
  }
};
