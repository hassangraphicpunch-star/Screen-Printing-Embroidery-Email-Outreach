import { BusinessContact, EmailTemplate } from '../types';

export const SENDER_EMAIL = 'graphicspunching264@gmail.com';
export const SENDER_WEBSITE = 'https://graphicspunching.com';

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'default-outreach',
    name: 'Vectorization & Digitizing (Default)',
    description: 'Standard professional outreach offering vector artwork and embroidery digitizing',
    subject: 'Professional Vectorization & Embroidery Digitizing Services',
    body: `Hi {GREETING}

I provide professional vectorization and embroidery digitizing services. If you need any assistance with vector artwork or embroidery digitizing, please feel free to contact me.

I’d be happy to help with your projects.

Email: graphicspunching264@gmail.com
Website: https://graphicspunching.com`,
  },
  {
    id: 'screen-printing-focus',
    name: 'Screen Printing Vector Art Focus',
    description: 'Tailored for screen printing shops needing sharp vector art and color separations',
    subject: 'Clean Vector Artwork & Color Separations for {BUSINESS_NAME}',
    body: `Hi {GREETING}

Hope your print operations are going smoothly at {BUSINESS_NAME}.

I specialize in high-precision vectorization, redraws, and color separations for screen printing businesses. Whether you need complex raster logos converted to crisp vectors or production-ready files with fast turnaround, I can help keep your presses running without delays.

I'd be glad to assist with your current or upcoming projects.

Email: graphicspunching264@gmail.com
Website: https://graphicspunching.com`,
  },
  {
    id: 'embroidery-digitizing-focus',
    name: 'Embroidery Digitizing & Puff Focus',
    description: 'Tailored for embroidery businesses needing clean stitch files (DST, PES, EMB)',
    subject: 'Production-Ready Embroidery Digitizing for {BUSINESS_NAME}',
    body: `Hi {GREETING}

I provide top-tier embroidery digitizing services (flat stitch, 3D puff, left chest, full jacket back, and cap designs) with minimal thread breaks and clean underlays.

If {BUSINESS_NAME} has any artwork needing digitizing for smooth machine embroidery, feel free to reach out.

I’d be happy to digitize a test file for your shop.

Email: graphicspunching264@gmail.com
Website: https://graphicspunching.com`,
  },
  {
    id: 'quick-intro',
    name: 'Short & Direct Inquiry',
    description: 'A concise intro message ideal for busy shop owners and production managers',
    subject: 'Vector & Embroidery Digitizing Support for {BUSINESS_NAME}',
    body: `Hi {GREETING}

Reaching out to see if you currently need reliable, fast turnaround support for vector artwork conversions or embroidery digitizing at {BUSINESS_NAME}.

I offer premium quality redraws and digitizing suited for production. Let me know if I can assist with any upcoming jobs!

Best regards,
Graphics Punching
Email: graphicspunching264@gmail.com
Website: https://graphicspunching.com`,
  },
];

/**
 * Generate a clean, personalized greeting.
 * If owner name is present: "Hi John," (or if template already has "Hi", format as "John,")
 * If owner name is empty: "" (or "," to yield "Hi,")
 */
export function getPersonalizedGreeting(ownerName: string): string {
  const cleanName = (ownerName || '').trim();
  if (!cleanName) {
    return ',';
  }
  return ` ${cleanName},`;
}

/**
 * Interpolate template variables into personalized email content
 */
export function personalizeEmail(
  templateBody: string,
  contact: BusinessContact
): { subject: string; body: string } {
  const cleanOwner = (contact.ownerName || '').trim();
  const businessName = (contact.businessName || '').trim() || 'your shop';
  const email = contact.email || '';

  // Format greeting token:
  // If template is "Hi {GREETING}"
  // With owner "Michael" -> "Hi Michael,"
  // Without owner -> "Hi,"
  let greetingReplacement = ',';
  if (cleanOwner) {
    greetingReplacement = ` ${cleanOwner},`;
  }

  let body = templateBody;
  
  // Replace standard placeholders
  body = body.replace(/Hi\s*\{GREETING\}/gi, cleanOwner ? `Hi ${cleanOwner},` : `Hi,`);
  body = body.replace(/\{GREETING\}/gi, greetingReplacement);
  body = body.replace(/\{OWNER_NAME\}/gi, cleanOwner || '');
  body = body.replace(/\{BUSINESS_NAME\}/gi, businessName);
  body = body.replace(/\{EMAIL\}/gi, email);
  body = body.replace(/\{PHONE\}/gi, contact.phone || '');
  body = body.replace(/\{ADDRESS\}/gi, contact.address || '');
  body = body.replace(/\{WEBSITE\}/gi, SENDER_WEBSITE);
  body = body.replace(/\{SENDER_WEBSITE\}/gi, SENDER_WEBSITE);
  body = body.replace(/\{SENDER_EMAIL\}/gi, SENDER_EMAIL);

  return {
    subject: '',
    body: body.trim(),
  };
}

/**
 * Personalize subject line
 */
export function personalizeSubject(
  templateSubject: string,
  contact: BusinessContact
): string {
  const cleanOwner = (contact.ownerName || '').trim();
  const businessName = (contact.businessName || '').trim() || 'Your Business';

  let subject = templateSubject;
  subject = subject.replace(/\{OWNER_NAME\}/gi, cleanOwner || businessName);
  subject = subject.replace(/\{BUSINESS_NAME\}/gi, businessName);
  subject = subject.replace(/\{EMAIL\}/gi, contact.email || '');

  return subject.trim();
}
