import * as XLSX from 'xlsx';
import { BusinessContact } from '../types';

/**
 * List of forbidden/placeholder words that must NEVER be used as a business owner name
 */
const FORBIDDEN_OWNER_PLACEHOLDERS = new Set([
  'no',
  'n/a',
  'na',
  'none',
  'unknown',
  'null',
  'nil',
  'undefined',
  'not available',
  'not provided',
  'nan',
  '-',
  '--',
  '/',
  '.',
  '?',
  'x',
  'xx',
  'owner',
  'manager',
  'business owner',
  'admin',
  'contact',
  'sir',
  'madam',
  'sir/madam',
]);

/**
 * Clean and normalize a business owner name.
 * If missing, invalid, or matching a placeholder like 'No' or 'N/A', return empty string "".
 */
export function sanitizeOwnerName(rawName: unknown): string {
  if (rawName === null || rawName === undefined) {
    return '';
  }

  const str = String(rawName).trim();
  if (!str) return '';

  const lower = str.toLowerCase().replace(/[\s._-]+/g, ' ').trim();

  // If the value matches any banned placeholder, return blank
  if (FORBIDDEN_OWNER_PLACEHOLDERS.has(lower)) {
    return '';
  }

  // If it starts with common placeholder phrases like "no owner" or "n/a", blank it
  if (
    lower.startsWith('n/a') ||
    lower.startsWith('no ') ||
    lower === 'no' ||
    lower.startsWith('unknown') ||
    lower.startsWith('none')
  ) {
    return '';
  }

  return str;
}

/**
 * RFC 5322 compliant regex for basic email format validation
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validate an email string.
 * Preserves the exact characters and checks for presence of @ and valid domain.
 */
export function validateEmail(rawEmail: unknown): {
  email: string;
  isValid: boolean;
  error?: string;
} {
  if (rawEmail === null || rawEmail === undefined) {
    return { email: '', isValid: false, error: 'Email address is missing' };
  }

  // Trim whitespace around the email, but preserve the exact case and internal characters
  const email = String(rawEmail).trim();

  if (!email) {
    return { email: '', isValid: false, error: 'Email address is empty' };
  }

  if (!email.includes('@')) {
    return { email, isValid: false, error: "Missing '@' symbol in email address" };
  }

  const parts = email.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { email, isValid: false, error: 'Malformed email format' };
  }

  if (!parts[1].includes('.')) {
    return { email, isValid: false, error: "Missing top-level domain (e.g. '.com')" };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { email, isValid: false, error: 'Invalid email character format' };
  }

  return { email, isValid: true };
}

/**
 * Fuzzy column header matcher to match flexible Excel spreadsheet column titles
 */
function findColumnKey(rowKeys: string[], aliases: string[]): string | null {
  for (const key of rowKeys) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const alias of aliases) {
      const aliasNorm = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalized === aliasNorm || normalized.includes(aliasNorm) || aliasNorm.includes(normalized)) {
        return key;
      }
    }
  }
  return null;
}

/**
 * Parse an Excel file (ArrayBuffer) and return a structured list of BusinessContact records
 */
export function parseExcelFile(data: ArrayBuffer): {
  contacts: BusinessContact[];
  sheetName: string;
  totalRows: number;
} {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('The uploaded Excel file contains no worksheets.');
  }

  const worksheet = workbook.Sheets[sheetName];
  // Convert worksheet to array of objects
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false, // get formatted text to avoid float formatting issues
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('The worksheet is empty or contains no readable rows.');
  }

  // Inspect first row keys
  const sampleKeys = Object.keys(rawRows[0] || {});

  // Key aliases
  const ownerAliases = [
    'business owner name',
    'owner name',
    'owner',
    'contact person',
    'contact name',
    'full name',
    'name',
    'proprietor',
    'client name',
  ];

  const businessAliases = [
    'business name',
    'company name',
    'company',
    'shop name',
    'business',
    'store name',
    'studio name',
    'client',
    'organization',
  ];

  const emailAliases = [
    'email address',
    'email',
    'e-mail',
    'mail',
    'contact email',
    'primary email',
    'business email',
  ];

  const phoneAliases = [
    'phone number',
    'phone',
    'mobile',
    'cell',
    'telephone',
    'tel',
    'contact number',
  ];

  const addressAliases = [
    'address',
    'street address',
    'location',
    'city',
    'state',
    'full address',
    'address line',
  ];

  const ownerKey = findColumnKey(sampleKeys, ownerAliases);
  const businessKey = findColumnKey(sampleKeys, businessAliases);
  const emailKey = findColumnKey(sampleKeys, emailAliases);
  const phoneKey = findColumnKey(sampleKeys, phoneAliases);
  const addressKey = findColumnKey(sampleKeys, addressAliases);

  const contacts: BusinessContact[] = [];

  rawRows.forEach((row, index) => {
    // Check if entire row is empty
    const values = Object.values(row).map((v) => String(v).trim()).filter(Boolean);
    if (values.length === 0) return; // skip empty rows safely

    const rawOwner = ownerKey ? row[ownerKey] : '';
    const rawBusiness = businessKey ? row[businessKey] : '';
    const rawEmail = emailKey ? row[emailKey] : '';
    const rawPhone = phoneKey ? row[phoneKey] : '';
    const rawAddress = addressKey ? row[addressKey] : '';

    // Sanitize owner name (CRITICAL: NEVER 'No', 'N/A')
    const ownerName = sanitizeOwnerName(rawOwner);
    const businessName = String(rawBusiness || '').trim() || (ownerName ? `${ownerName}'s Shop` : 'Screen Print & Embroidery Business');
    const emailValidation = validateEmail(rawEmail);
    const phone = String(rawPhone || '').trim();
    const address = String(rawAddress || '').trim();

    contacts.push({
      id: `contact_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
      ownerName,
      businessName,
      email: emailValidation.email,
      phone,
      address,
      isValidEmail: emailValidation.isValid,
      validationError: emailValidation.error,
      sendStatus: 'pending',
    });
  });

  return {
    contacts,
    sheetName,
    totalRows: rawRows.length,
  };
}

/**
 * Generate and download a sample Excel file template formatted for screen printing and embroidery leads
 */
export function downloadSampleExcelTemplate(): void {
  const sampleData = [
    {
      'Business Owner Name': 'Michael Roberts',
      'Business Name': 'Apex Screen Printing & Apparel',
      'Email Address': 'michael@apexapparelprints.com',
      'Phone Number': '(555) 234-5678',
      'Address': '124 Industrial Way, Austin, TX',
    },
    {
      'Business Owner Name': 'Sarah Jenkins',
      'Business Name': 'ThreadCraft Embroidery Studio',
      'Email Address': 'sarah@threadcraftembroidery.com',
      'Phone Number': '(555) 345-6789',
      'Address': '450 Stitcher Blvd, Charlotte, NC',
    },
    {
      'Business Owner Name': '', // Missing owner - will test graceful fallback
      'Business Name': 'Custom Stitches & Print Co.',
      'Email Address': 'orders@customstitchesco.com',
      'Phone Number': '(555) 456-7890',
      'Address': '789 Silk Screen Rd, Portland, OR',
    },
    {
      'Business Owner Name': 'David Chang',
      'Business Name': 'ProVector Stitch & Print Works',
      'Email Address': 'david.chang@provectorprint.com',
      'Phone Number': '(555) 567-8901',
      'Address': '88 Garment Way, Los Angeles, CA',
    },
    {
      'Business Owner Name': 'N/A', // Testing placeholder rejection
      'Business Name': 'Velocity Graphic Merch',
      'Email Address': 'production@velocitymerch.com',
      'Phone Number': '(555) 678-9012',
      'Address': '300 Print Park, Miami, FL',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths for nice appearance
  worksheet['!cols'] = [
    { wch: 22 }, // Business Owner Name
    { wch: 32 }, // Business Name
    { wch: 32 }, // Email Address
    { wch: 18 }, // Phone Number
    { wch: 36 }, // Address
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Screen Print & Embroidery Leads');

  XLSX.writeFile(workbook, 'Screen_Printing_Embroidery_Leads_Template.xlsx');
}

/**
 * Pre-defined sample dataset ready to load in 1 click for instant demonstration and verification
 */
export const SAMPLE_SCREEN_PRINTING_CONTACTS: BusinessContact[] = [
  {
    id: 'lead-1',
    ownerName: 'Robert Miller',
    businessName: 'Apex Screen Printing & Graphics',
    email: 'info@apexprints.com',
    phone: '+1 (555) 234-8901',
    address: '1420 Industrial Blvd, Austin, TX 78745',
    isValidEmail: true,
    sendStatus: 'pending',
  },
  {
    id: 'lead-2',
    ownerName: 'Elena Rostova',
    businessName: 'Elite Stitch Embroidery Studio',
    email: 'elena@elitestitchemb.com',
    phone: '+1 (555) 876-5432',
    address: '890 Garment District Dr, New York, NY 10018',
    isValidEmail: true,
    sendStatus: 'pending',
  },
  {
    id: 'lead-3',
    ownerName: '', // Notice: Left blank, will generate "Hi,"
    businessName: 'Sun Valley Custom Silkscreen',
    email: 'orders@sunvalleyapparel.com',
    phone: '+1 (555) 432-1098',
    address: '550 Desert Ridge Way, Phoenix, AZ 85001',
    isValidEmail: true,
    sendStatus: 'pending',
  },
  {
    id: 'lead-4',
    ownerName: 'Marcus Bennett',
    businessName: 'Prime Stitch & Digitizing Hub',
    email: 'marcus@primestitchhub.com',
    phone: '+1 (555) 654-3210',
    address: '220 Embroidery Plaza, Charlotte, NC 28202',
    isValidEmail: true,
    sendStatus: 'pending',
  },
  {
    id: 'lead-5',
    ownerName: 'Chloe Davis',
    businessName: 'Coastal Vector & Print Labs',
    email: 'chloe.davis@coastalvector.com',
    phone: '+1 (555) 321-7654',
    address: '104 Ocean View Terrace, San Diego, CA 92101',
    isValidEmail: true,
    sendStatus: 'pending',
  },
  {
    id: 'lead-6',
    ownerName: 'No', // Should be sanitized to ""
    businessName: 'Metro Uniforms & Embroidery',
    email: 'support@metrouniformsemb.com',
    phone: '+1 (555) 998-1122',
    address: '330 Commerce Park, Chicago, IL 60607',
    isValidEmail: true,
    sendStatus: 'pending',
  },
];
