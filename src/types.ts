export interface BusinessContact {
  id: string;
  ownerName: string; // Left blank if unavailable or invalid placeholder
  businessName: string;
  email: string;
  phone: string;
  address: string;
  isValidEmail: boolean;
  validationError?: string;
  sendStatus: 'pending' | 'sending' | 'sent' | 'failed';
  sentAt?: string;
  sendError?: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  dataBase64: string; // Base64 encoded string
  previewUrl?: string; // Blob or Data URL for image thumbnail preview
  fileType: 'image' | 'document' | 'other';
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  description: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    email: string;
    displayName: string;
    photoURL?: string;
    uid: string;
  } | null;
  accessToken: string | null;
  error?: string | null;
  isLoading: boolean;
}

export interface SendLogEntry {
  id: string;
  contactId: string;
  recipientEmail: string;
  recipientName: string;
  businessName: string;
  subject: string;
  status: 'success' | 'failed';
  timestamp: string;
  errorMessage?: string;
  attachmentCount: number;
}

export interface EmailReply {
  id: string;
  threadId: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  snippet: string;
  date: string;
  internalDate?: string;
  bodyText: string;
  bodyHtml?: string;
  matchedContact?: BusinessContact;
  isRead: boolean;
  sentiment?: 'interested' | 'inquiry' | 'quote_request' | 'neutral' | 'unsubscribed';
  messageIdHeader?: string;
}
