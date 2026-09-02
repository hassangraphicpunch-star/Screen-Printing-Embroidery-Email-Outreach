import { BusinessContact, EmailAttachment, EmailReply } from '../types';

export interface SendEmailParams {
  to: string;
  fromName?: string;
  fromEmail: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  attachments?: EmailAttachment[];
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

/**
 * Encode a string or binary safely into base64url for Gmail API (RFC 4648 § 5)
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decode base64url string from Gmail API
 */
function decodeBase64Url(str: string): string {
  if (!str) return '';
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    try {
      return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

/**
 * Encode UTF-8 string to base64 safely supporting Unicode characters
 */
function utf8ToBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
}

/**
 * Build RFC 2822 compliant MIME multipart email raw string
 */
export function buildMimeRawMessage({
  to,
  fromName,
  fromEmail,
  subject,
  bodyText,
  bodyHtml,
  attachments = [],
  inReplyTo,
  references,
}: SendEmailParams): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const crlf = '\r\n';

  // Format From header with friendly display name if available
  const senderHeader = fromName
    ? `From: =?UTF-8?B?${utf8ToBase64(fromName)}?= <${fromEmail}>`
    : `From: <${fromEmail}>`;

  // Encode subject line with RFC 2047 UTF-8 B encoding
  const subjectHeader = `Subject: =?UTF-8?B?${utf8ToBase64(subject)}?=`;

  const headers = [
    senderHeader,
    `To: <${to}>`,
    subjectHeader,
    'MIME-Version: 1.0',
  ];

  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
  }
  if (references) {
    headers.push(`References: ${references}`);
  }

  headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);

  let raw = headers.join(crlf) + crlf + crlf;

  // 1. Text & HTML body section (multipart/alternative if both provided)
  const altBoundary = `alt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  raw += `--${boundary}${crlf}`;
  raw += `Content-Type: multipart/alternative; boundary="${altBoundary}"${crlf}${crlf}`;

  // Plain Text Part
  raw += `--${altBoundary}${crlf}`;
  raw += `Content-Type: text/plain; charset="UTF-8"${crlf}`;
  raw += `Content-Transfer-Encoding: base64${crlf}${crlf}`;
  raw += utf8ToBase64(bodyText) + crlf;

  // HTML Part
  const finalHtml = bodyHtml || bodyText.replace(/\n/g, '<br/>');
  raw += `--${altBoundary}${crlf}`;
  raw += `Content-Type: text/html; charset="UTF-8"${crlf}`;
  raw += `Content-Transfer-Encoding: base64${crlf}${crlf}`;
  raw += utf8ToBase64(finalHtml) + crlf;

  raw += `--${altBoundary}--${crlf}`;

  // 2. Attachments
  for (const att of attachments) {
    const encodedFilename = `=?UTF-8?B?${utf8ToBase64(att.filename)}?=`;
    raw += `--${boundary}${crlf}`;
    raw += `Content-Type: ${att.contentType || 'application/octet-stream'}; name="${encodedFilename}"${crlf}`;
    raw += `Content-Disposition: attachment; filename="${encodedFilename}"${crlf}`;
    raw += `Content-Transfer-Encoding: base64${crlf}${crlf}`;
    
    // att.dataBase64 is already base64 string without data: prefix
    const cleanBase64 = att.dataBase64.replace(/\r?\n/g, '');
    // Wrap at 76 characters per RFC 2045 specification
    const wrapped = cleanBase64.match(/.{1,76}/g)?.join(crlf) || cleanBase64;
    raw += wrapped + crlf;
  }

  raw += `--${boundary}--`;

  // Encode the entire raw message to base64url
  const utf8Bytes = new TextEncoder().encode(raw);
  let binaryString = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binaryString += String.fromCharCode(utf8Bytes[i]);
  }

  return base64UrlEncode(binaryString);
}

/**
 * Send an email directly using the user's Gmail OAuth access token
 */
export async function sendGmailMessage(
  accessToken: string,
  params: SendEmailParams
): Promise<{ id: string; threadId: string }> {
  if (!accessToken) {
    throw new Error('No Gmail access token provided. Please connect your Gmail account.');
  }

  const raw = buildMimeRawMessage(params);
  const requestBody: { raw: string; threadId?: string } = { raw };
  if (params.threadId) {
    requestBody.threadId = params.threadId;
  }

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('Gmail API Error response:', errorData);

    if (response.status === 401) {
      throw new Error('Gmail session has expired or is invalid. Please reconnect your Gmail account.');
    }
    if (response.status === 403) {
      throw new Error(
        'Gmail permission denied. Please ensure you granted permission to send emails from your Gmail account.'
      );
    }
    
    const message = errorData?.error?.message || `Gmail API Error (${response.status}): ${response.statusText}`;
    throw new Error(message);
  }

  return response.json();
}

/**
 * Extract body text and html from Gmail message payload
 */
function extractBodyFromPayload(payload: any): { text: string; html: string } {
  let text = '';
  let html = '';

  if (!payload) return { text, html };

  if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (payload.mimeType === 'text/html') {
      html = decoded;
    } else {
      text = decoded;
    }
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text = decodeBase64Url(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html = decodeBase64Url(part.body.data);
      } else if (part.parts) {
        const nested = extractBodyFromPayload(part);
        if (nested.text && !text) text = nested.text;
        if (nested.html && !html) html = nested.html;
      }
    }
  }

  return { text, html };
}

/**
 * Infer sentiment/intent category from reply text
 */
function analyzeReplySentiment(subject: string, body: string): 'interested' | 'quote_request' | 'inquiry' | 'neutral' | 'unsubscribed' {
  const content = `${subject} ${body}`.toLowerCase();
  
  if (
    content.includes('unsubscribe') ||
    content.includes('remove me') ||
    content.includes('stop emailing') ||
    content.includes('not interested')
  ) {
    return 'unsubscribed';
  }

  if (
    content.includes('quote') ||
    content.includes('price') ||
    content.includes('pricing') ||
    content.includes('cost') ||
    content.includes('rate') ||
    content.includes('how much')
  ) {
    return 'quote_request';
  }

  if (
    content.includes('interested') ||
    content.includes('send samples') ||
    content.includes('let us talk') ||
    content.includes('call me') ||
    content.includes('send catalog') ||
    content.includes('portfolio') ||
    content.includes('yes') ||
    content.includes('we need') ||
    content.includes('turnaround')
  ) {
    return 'interested';
  }

  if (
    content.includes('question') ||
    content.includes('format') ||
    content.includes('dst') ||
    content.includes('vector') ||
    content.includes('embroidery') ||
    content.includes('digitizing')
  ) {
    return 'inquiry';
  }

  return 'neutral';
}

/**
 * Fetch received replies & inbox messages from Gmail API
 */
export async function fetchGmailReplies(
  accessToken: string,
  contacts: BusinessContact[] = []
): Promise<EmailReply[]> {
  if (!accessToken) {
    throw new Error('Please connect your Gmail account to check for replies.');
  }

  // Create quick email lookup map for matching
  const contactMap = new Map<string, BusinessContact>();
  contacts.forEach((c) => {
    if (c.email) {
      contactMap.set(c.email.trim().toLowerCase(), c);
    }
  });

  try {
    // Search inbox messages (or replies)
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30&q=in:inbox',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!listRes.ok) {
      if (listRes.status === 401) {
        throw new Error('Gmail session has expired. Please reconnect.');
      }
      throw new Error(`Gmail API failed with status: ${listRes.status}`);
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];

    if (messages.length === 0) {
      return [];
    }

    // Fetch message details in parallel
    const detailPromises = messages.slice(0, 20).map(async (item: { id: string; threadId: string }) => {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!msgRes.ok) return null;
        const msgData = await msgRes.json();

        // Extract headers
        const headersList = msgData.payload?.headers || [];
        const getHeader = (name: string) =>
          headersList.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const fromRaw = getHeader('From');
        const toRaw = getHeader('To');
        const subject = getHeader('Subject') || '(No Subject)';
        const dateHeader = getHeader('Date');
        const messageIdHeader = getHeader('Message-ID');

        // Parse fromName and fromEmail
        let fromName = '';
        let fromEmail = fromRaw;
        const fromMatch = fromRaw.match(/(.*)<(.+)>/);
        if (fromMatch) {
          fromName = fromMatch[1].replace(/["']/g, '').trim();
          fromEmail = fromMatch[2].trim();
        } else {
          fromEmail = fromRaw.replace(/[<>]/g, '').trim();
          fromName = fromEmail.split('@')[0];
        }

        const { text, html } = extractBodyFromPayload(msgData.payload);
        const snippet = msgData.snippet || text.slice(0, 140);
        const matchedContact = contactMap.get(fromEmail.toLowerCase());
        const sentiment = analyzeReplySentiment(subject, text || snippet);

        const reply: EmailReply = {
          id: msgData.id,
          threadId: msgData.threadId,
          fromName: fromName || matchedContact?.ownerName || matchedContact?.businessName || fromEmail,
          fromEmail,
          toEmail: toRaw,
          subject,
          snippet,
          date: dateHeader || new Date(Number(msgData.internalDate || Date.now())).toLocaleString(),
          internalDate: msgData.internalDate,
          bodyText: text || snippet,
          bodyHtml: html,
          matchedContact,
          isRead: !msgData.labelIds?.includes('UNREAD'),
          sentiment,
          messageIdHeader,
        };

        return reply;
      } catch (e) {
        console.warn('Error fetching message details for id:', item.id, e);
        return null;
      }
    });

    const results = await Promise.all(detailPromises);
    const validReplies = results.filter((r): r is EmailReply => r !== null);

    return validReplies;
  } catch (err: any) {
    console.error('Error fetching Gmail replies:', err);
    throw err;
  }
}

/**
 * Fetch the connected user's Gmail profile information
 */
export async function fetchGmailProfile(accessToken: string): Promise<GmailProfile> {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to retrieve Gmail profile. Token may need refreshing.');
  }

  return response.json();
}
