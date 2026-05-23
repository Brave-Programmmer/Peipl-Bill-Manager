export const numberToWords = (num: number): string => {
  if (num === 0) return 'ZERO';

  const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
  const b = ['', '', 'TWENTY ', 'THIRTY ', 'FORTY ', 'FIFTY ', 'SIXTY ', 'SEVENTY ', 'EIGHTY ', 'NINETY '];

  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + 'HUNDRED ' + convert(n % 100);
    if (n < 100000) return convert(Math.floor(n / 1000)) + 'THOUSAND ' + convert(n % 1000);
    if (n < 10000000) return convert(Math.floor(n / 100000)) + 'LAKH ' + convert(n % 100000);
    return convert(Math.floor(n / 10000000)) + 'CRORE ' + convert(n % 10000000);
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let result = '';
  if (integerPart > 0) {
    result = convert(integerPart);
  }
  
  if (decimalPart > 0) {
    result += (integerPart > 0 ? 'AND ' : '') + convert(decimalPart) + 'PAISE ';
  }

  return result.trim().toUpperCase();
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

export const parseNumeric = (value: string | number | undefined | null): number => {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  // Match the first number (including decimals) in the string
  const match = value.toString().match(/(\d+(\.\d+)?)/);
  return match ? Number(match[0]) : 0;
};

export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date); // Return as is if invalid
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

export const formatDateForInput = (date: string | Date | undefined | null): string => {
  if (!date) return '';
  
  // If already in DD/MM/YYYY, convert to YYYY-MM-DD for input[type="date"]
  if (typeof date === 'string' && date.includes('/')) {
    const parts = date.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (year.length === 4) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};
