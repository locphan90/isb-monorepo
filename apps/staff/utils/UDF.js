// utils/UDF.js

export function isValidNumber(val) {
    return !isNaN(val) && val !== '' && val !== null
}

export function formatToISODate(dateStr) {
    if (!dateStr) return "";
    
    // Splits by '/' or '-'
    const parts = dateStr.toString().trim().split(/[\/-]/);
    
    if (parts.length === 3) {
        const [day, month, year] = parts;
        // Pad single-digit day or month with leading zeros (e.g., "5" -> "05")
        const paddedDay = day.padStart(2, '0');
        const paddedMonth = month.padStart(2, '0');
        
        return `${year}-${paddedMonth}-${paddedDay}`;
    }
    
    return dateStr; // Return original string if it doesn't match expected pattern
}

export function VietnameseName2UpperKhongDau(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function StripLeadingQuote(str) {
    return String(str ?? '').replace(/^'+/, '').trim()
}


export const cleanText = (text) => {
  if (!text) return '';

  let cleaned = text.replace(/<\/?[^>]+(>|$)/g, '');

  const entities = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  };

  cleaned = cleaned.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match);

  cleaned = cleaned
    .replace(/\n\s*\n/g, '\n\n') // Collapse multiple blank lines into a double newline
    .trim();

  return cleaned;
};

export function extractFolderIdFromUrl(Url) {
  if (!Url || typeof Url !== 'string') return null;

  const trimmed = Url.trim();
  const queryParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryParamMatch) {
      return queryParamMatch[1];
  }
  const pathMatch = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (pathMatch) {
      return pathMatch[1];
  }
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
      return trimmed;
  }
  return null
}            
