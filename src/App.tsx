import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { ContactTable } from './components/ContactTable';
import { EmailComposer } from './components/EmailComposer';
import { ExcelUploader } from './components/ExcelUploader';
import { EmailPreviewModal } from './components/EmailPreviewModal';
import { ConfirmSendModal } from './components/ConfirmSendModal';
import { SendProgressModal } from './components/SendProgressModal';
import { SendLogViewer } from './components/SendLogViewer';
import { EditContactModal } from './components/EditContactModal';
import { RepliesViewer } from './components/RepliesViewer';
import {
  BusinessContact,
  EmailAttachment,
  AuthState,
  SendLogEntry,
  EmailReply,
} from './types';
import {
  initAuthListener,
  signInWithGoogle,
  logOutFromGoogle,
  getActiveAccessToken,
} from './services/firebaseAuth';
import {
  sendGmailMessage,
  fetchGmailProfile,
  fetchGmailReplies,
} from './services/gmailApi';
import {
  downloadSampleExcelTemplate,
  SAMPLE_SCREEN_PRINTING_CONTACTS,
} from './services/excelParser';
import {
  personalizeEmail,
  personalizeSubject,
  SENDER_EMAIL,
} from './services/templateService';
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  History,
  Info,
  Inbox,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';

const INITIAL_SAMPLE_REPLIES: EmailReply[] = [
  {
    id: 'reply-101',
    threadId: 'thread-alpha-101',
    fromName: 'Robert Vance (Alpha Screen Graphics)',
    fromEmail: 'orders@alphascreengraphics.com',
    toEmail: 'graphicspunching264@gmail.com',
    subject: 'Re: High-Speed Vector Artwork & Digitizing for Alpha Screen Graphics',
    snippet: 'Hi Hassan, we received your sample vector pack. We have 2 complex customer raster logos that need clean AI vectorization today. Can you send over a quote and turnaround time?',
    date: 'Today at 10:15 AM',
    bodyText: `Hi Hassan,\n\nWe received your sample vector artwork proofs and embroidery stitch outs. We are impressed with the line sharpness on the small text.\n\nWe currently have 2 customer logos (a multi-color badge and a vintage emblem) that need raster-to-vector conversion for screen printing separations.\n\nCould you let us know your turnaround time for same-day delivery and what file formats (AI, EPS, PDF) you provide?\n\nThanks,\nRobert Vance\nProduction Manager, Alpha Screen Graphics`,
    matchedContact: SAMPLE_SCREEN_PRINTING_CONTACTS[0],
    isRead: false,
    sentiment: 'quote_request',
  },
  {
    id: 'reply-102',
    threadId: 'thread-apex-102',
    fromName: 'Sarah Jenkins (Apex Apparel Studio)',
    fromEmail: 'art@apexapparelstudio.com',
    toEmail: 'graphicspunching264@gmail.com',
    subject: 'Re: Premium Embroidery Digitizing & Vector Proofs for Apex Apparel Studio',
    snippet: 'Hello, what machine formats do you export for embroidery digitizing? We use Tajima (.DST) and Barudan machines.',
    date: 'Yesterday at 4:30 PM',
    bodyText: `Hello Hassan Graphic,\n\nThank you for reaching out. We run multiple 6-head Tajima embroidery machines and occasionally Barudan.\n\nDo you provide native .DST and .EMB files with 3D puff embroidery density compensation?\n\nWe have a batch of left-chest company polos starting next Tuesday.\n\nBest,\nSarah Jenkins\nArt Director, Apex Apparel Studio`,
    matchedContact: SAMPLE_SCREEN_PRINTING_CONTACTS[1],
    isRead: true,
    sentiment: 'interested',
  },
  {
    id: 'reply-103',
    threadId: 'thread-custom-103',
    fromName: 'Marcus Miller (Custom Print Masters)',
    fromEmail: 'quotes@customprintmasters.com',
    toEmail: 'graphicspunching264@gmail.com',
    subject: 'Re: Fast Vector Conversion Services for Screen Printers',
    snippet: 'Thanks for the email! Please send over your wholesale rate sheet and sample pack.',
    date: 'Aug 16, 2026',
    bodyText: `Hi there,\n\nWe are looking for a reliable backup vector and digitizing provider for our peak season.\n\nPlease email your price breakdown for bulk weekly orders and your standard payment terms.\n\nRegards,\nMarcus Miller`,
    matchedContact: SAMPLE_SCREEN_PRINTING_CONTACTS[3],
    isRead: true,
    sentiment: 'inquiry',
  },
];

export default function App() {
  // 1. Auth State
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    error: null,
    isLoading: true,
  });

  // 2. Contacts State
  const [contacts, setContacts] = useState<BusinessContact[]>(() => {
    try {
      const saved = localStorage.getItem('screen_printing_leads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return SAMPLE_SCREEN_PRINTING_CONTACTS;
  });

  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(
    () => new Set(SAMPLE_SCREEN_PRINTING_CONTACTS.slice(0, 3).map((c) => c.id))
  );

  const [focusedContact, setFocusedContact] = useState<BusinessContact | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'valid' | 'invalid' | 'sent' | 'pending'>('all');
  const [activeTab, setActiveTab] = useState<'contacts' | 'replies' | 'logs'>('contacts');

  // 3. Replies & Inbox State
  const [replies, setReplies] = useState<EmailReply[]>(() => {
    try {
      const saved = localStorage.getItem('outreach_replies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_SAMPLE_REPLIES;
  });
  const [isFetchingReplies, setIsFetchingReplies] = useState(false);

  // 4. Modals State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingContact, setEditingContact] = useState<BusinessContact | null>(null);
  const [previewData, setPreviewData] = useState<{
    contact: BusinessContact;
    subject: string;
    body: string;
    attachments: EmailAttachment[];
  } | null>(null);

  const [confirmSendData, setConfirmSendData] = useState<{
    contacts: BusinessContact[];
    subject: string;
    bodyTemplate: string;
    attachments: EmailAttachment[];
  } | null>(null);

  // 5. Batch Progress State
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({
    isOpen: false,
    total: 0,
    currentProgress: 0,
    currentContactName: '',
    currentContactEmail: '',
    successCount: 0,
    failCount: 0,
    isComplete: false,
  });

  const [sendLogs, setSendLogs] = useState<SendLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('outreach_send_logs');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const cancelBatchRef = useRef(false);

  // Save contacts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('screen_printing_leads', JSON.stringify(contacts));
    } catch (err) {
      console.error('Failed to persist contacts in localStorage:', err);
    }
  }, [contacts]);

  // Save logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('outreach_send_logs', JSON.stringify(sendLogs));
    } catch (err) {
      console.error('Failed to persist logs in localStorage:', err);
    }
  }, [sendLogs]);

  // Save replies to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('outreach_replies', JSON.stringify(replies));
    } catch (err) {
      console.error('Failed to persist replies in localStorage:', err);
    }
  }, [replies]);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Initialize Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = initAuthListener(
      (user, token) => {
        setAuthState({
          isAuthenticated: true,
          user: {
            uid: user.uid,
            email: user.email || SENDER_EMAIL,
            displayName: user.displayName || 'Graphics Punching',
            photoURL: user.photoURL || undefined,
          },
          accessToken: token,
          error: null,
          isLoading: false,
        });
      },
      () => {
        setAuthState({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          error: null,
          isLoading: false,
        });
      }
    );

    return () => unsubscribe();
  }, []);

  // Connect Gmail with Google OAuth
  const handleConnectGmail = async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await signInWithGoogle();
      if (res) {
        setAuthState({
          isAuthenticated: true,
          user: {
            uid: res.user.uid,
            email: res.user.email || SENDER_EMAIL,
            displayName: res.user.displayName || 'Graphics Punching',
            photoURL: res.user.photoURL || undefined,
          },
          accessToken: res.accessToken,
          error: null,
          isLoading: false,
        });

        setNotification({
          type: 'success',
          message: `Successfully connected to Gmail as ${res.user.email || SENDER_EMAIL}!`,
        });
      } else {
        // Sign-in cancelled or already in progress
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (err: any) {
      console.error('Connect Gmail failed:', err);
      const errMsg = err?.message || 'Google OAuth failed. Please check permissions and popup settings.';
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errMsg,
      }));
      setNotification({
        type: 'error',
        message: errMsg,
      });
    }
  };

  // Disconnect Gmail
  const handleDisconnectGmail = async () => {
    try {
      await logOutFromGoogle();
      setAuthState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        error: null,
        isLoading: false,
      });
      setNotification({
        type: 'info',
        message: 'Gmail account disconnected.',
      });
    } catch (err: any) {
      console.error('Error signing out:', err);
    }
  };

  // Reconnect Gmail
  const handleReconnectGmail = async () => {
    await handleConnectGmail();
  };

  // Replies sync handler
  const handleRefreshReplies = async () => {
    if (!authState.accessToken) {
      setNotification({
        type: 'info',
        message: 'Please connect graphicspunching264@gmail.com to sync real-time replies.',
      });
      return;
    }

    setIsFetchingReplies(true);
    try {
      const fetched = await fetchGmailReplies(authState.accessToken, contacts);
      if (fetched.length > 0) {
        setReplies(fetched);
        setNotification({
          type: 'success',
          message: `Synced ${fetched.length} replies & message threads for graphicspunching264@gmail.com!`,
        });
      } else {
        setNotification({
          type: 'info',
          message: 'Checked Gmail inbox: No new client replies found at this moment.',
        });
      }
    } catch (err: any) {
      console.error('Failed to sync replies:', err);
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to sync replies from Gmail inbox.',
      });
    } finally {
      setIsFetchingReplies(false);
    }
  };

  const handleSelectContactFromReply = (contact: BusinessContact) => {
    setFocusedContact(contact);
    setSelectedContactIds(new Set([contact.id]));
    setActiveTab('contacts');
  };

  // Contacts handlers
  const handleToggleSelect = (id: string) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = (ids: string[]) => {
    setSelectedContactIds(new Set(ids));
  };

  const handleDeselectAll = () => {
    setSelectedContactIds(new Set());
  };

  const handleImportSuccess = (newContacts: BusinessContact[], append: boolean) => {
    if (append) {
      setContacts((prev) => [...prev, ...newContacts]);
    } else {
      setContacts(newContacts);
      setSelectedContactIds(new Set(newContacts.filter((c) => c.isValidEmail).slice(0, 5).map((c) => c.id)));
    }
    setShowUploadModal(false);
    setNotification({
      type: 'success',
      message: `Successfully imported ${newContacts.length} business lead(s).`,
    });
  };

  const handleEditContactSave = (updated: BusinessContact) => {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditingContact(null);
    setNotification({
      type: 'success',
      message: `Updated ${updated.businessName} contact details.`,
    });
  };

  const handleDeleteContact = (id: string) => {
    const contactToDelete = contacts.find((c) => c.id === id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setNotification({
      type: 'info',
      message: contactToDelete
        ? `Removed "${contactToDelete.businessName}" from list.`
        : 'Contact removed from list.',
    });
  };

  const handleDeleteSelectedContacts = (ids: string[]) => {
    const idSet = new Set(ids);
    setContacts((prev) => prev.filter((c) => !idSet.has(c.id)));
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setNotification({
      type: 'info',
      message: `Deleted ${ids.length} contact(s) from outreach list.`,
    });
  };

  const handleClearAllContacts = () => {
    setContacts([]);
    setSelectedContactIds(new Set());
    setFocusedContact(null);
    setNotification({
      type: 'info',
      message: 'All contacts have been cleared.',
    });
  };

  const handleLoadSampleLeads = () => {
    setContacts(SAMPLE_SCREEN_PRINTING_CONTACTS);
    setSelectedContactIds(new Set(SAMPLE_SCREEN_PRINTING_CONTACTS.slice(0, 4).map((c) => c.id)));
    setNotification({
      type: 'success',
      message: 'Loaded sample screen printing & embroidery leads.',
    });
  };

  // Selected contacts for composer
  const selectedContactsList = contacts.filter((c) => selectedContactIds.has(c.id));

  // Open Preview Modal
  const handleOpenPreview = (
    renderedSubject: string,
    renderedBody: string,
    attachments: EmailAttachment[]
  ) => {
    const contact = focusedContact || selectedContactsList[0] || contacts[0];
    if (!contact) {
      setNotification({
        type: 'info',
        message: 'Please import or select at least one contact to preview.',
      });
      return;
    }

    setPreviewData({
      contact,
      subject: renderedSubject,
      body: renderedBody,
      attachments,
    });
  };

  // Initiate Send (opens confirmation modal)
  const handleInitiateSend = (
    subject: string,
    bodyTemplate: string,
    attachments: EmailAttachment[]
  ) => {
    const targetList = selectedContactsList.length > 0
      ? selectedContactsList
      : focusedContact
      ? [focusedContact]
      : [];

    if (targetList.length === 0) {
      setNotification({
        type: 'error',
        message: 'No contacts selected. Please check at least one business in the table.',
      });
      return;
    }

    setConfirmSendData({
      contacts: targetList,
      subject,
      bodyTemplate,
      attachments,
    });
  };

  // Execute Dispatch across selected contacts
  const executeBatchSend = async () => {
    if (!confirmSendData) return;
    const { contacts: targets, subject: rawSubject, bodyTemplate, attachments } = confirmSendData;
    setConfirmSendData(null);

    // Verify token
    let token = authState.accessToken || getActiveAccessToken();
    if (!token) {
      try {
        const signResult = await signInWithGoogle();
        if (!signResult?.accessToken) {
          throw new Error('Authentication required to send emails via Gmail.');
        }
        token = signResult.accessToken;
      } catch (err: any) {
        setNotification({
          type: 'error',
          message: err?.message || 'Please connect your Gmail account before sending.',
        });
        return;
      }
    }

    setIsSendingBatch(true);
    cancelBatchRef.current = false;

    const validTargets = targets.filter((c) => c.isValidEmail);
    const total = validTargets.length;

    setBatchProgress({
      isOpen: true,
      total,
      currentProgress: 0,
      currentContactName: '',
      currentContactEmail: '',
      successCount: 0,
      failCount: 0,
      isComplete: false,
    });

    let successCount = 0;
    let failCount = 0;
    const newLogs: SendLogEntry[] = [];

    const sender = authState.user?.email || SENDER_EMAIL;
    const senderName = authState.user?.displayName || 'Graphics Punching';

    for (let i = 0; i < total; i++) {
      if (cancelBatchRef.current) break;

      const contact = validTargets[i];
      const renderedSubject = personalizeSubject(rawSubject, contact);
      const renderedContent = personalizeEmail(bodyTemplate, contact);

      // Update contact status to sending
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, sendStatus: 'sending' } : c))
      );

      setBatchProgress((prev) => ({
        ...prev,
        currentProgress: i + 1,
        currentContactName: contact.businessName,
        currentContactEmail: contact.email,
      }));

      try {
        await sendGmailMessage(token, {
          to: contact.email,
          fromEmail: sender,
          fromName: senderName,
          subject: renderedSubject,
          bodyText: renderedContent.body,
          attachments,
        });

        successCount++;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const logEntry: SendLogEntry = {
          id: `log_${Date.now()}_${i}`,
          contactId: contact.id,
          recipientEmail: contact.email,
          recipientName: contact.ownerName,
          businessName: contact.businessName,
          subject: renderedSubject,
          status: 'success',
          timestamp: now,
          attachmentCount: attachments.length,
        };
        newLogs.push(logEntry);

        setContacts((prev) =>
          prev.map((c) =>
            c.id === contact.id
              ? { ...c, sendStatus: 'sent', sentAt: now, sendError: undefined }
              : c
          )
        );

        setBatchProgress((prev) => ({
          ...prev,
          successCount: prev.successCount + 1,
        }));
      } catch (err: any) {
        console.error(`Failed to send to ${contact.email}:`, err);
        failCount++;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const errMsg = err?.message || 'Failed to deliver email through Gmail API.';

        const logEntry: SendLogEntry = {
          id: `log_${Date.now()}_${i}`,
          contactId: contact.id,
          recipientEmail: contact.email,
          recipientName: contact.ownerName,
          businessName: contact.businessName,
          subject: renderedSubject,
          status: 'failed',
          timestamp: now,
          errorMessage: errMsg,
          attachmentCount: attachments.length,
        };
        newLogs.push(logEntry);

        setContacts((prev) =>
          prev.map((c) =>
            c.id === contact.id
              ? { ...c, sendStatus: 'failed', sendError: errMsg }
              : c
          )
        );

        setBatchProgress((prev) => ({
          ...prev,
          failCount: prev.failCount + 1,
        }));
      }

      // Small delay between sends to respect Gmail rate limit
      if (i < total - 1) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    setSendLogs((prev) => [...newLogs, ...prev]);
    setIsSendingBatch(false);
    setBatchProgress((prev) => ({
      ...prev,
      isComplete: true,
    }));

    setNotification({
      type: successCount > 0 ? 'success' : 'error',
      message: `Outreach completed: ${successCount} sent successfully${failCount > 0 ? `, ${failCount} failed` : ''}.`,
    });
  };

  // Single Contact Direct Send
  const handleSendSingleContact = (contact: BusinessContact) => {
    if (!contact.isValidEmail) {
      setNotification({
        type: 'error',
        message: 'Cannot send to invalid email address. Please edit the contact first.',
      });
      return;
    }
    setFocusedContact(contact);
    setConfirmSendData({
      contacts: [contact],
      subject: 'Professional Vectorization & Embroidery Digitizing Services',
      bodyTemplate: `Hi {GREETING}

I provide professional vectorization and embroidery digitizing services. If you need any assistance with vector artwork or embroidery digitizing, please feel free to contact me.

I’d be happy to help with your projects.

Email: graphicspunching264@gmail.com
Website: https://graphicspunching.com`,
      attachments: [],
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Header */}
      <Header
        authState={authState}
        onConnectGmail={handleConnectGmail}
        onDisconnectGmail={handleDisconnectGmail}
        onReconnectGmail={handleReconnectGmail}
        onDownloadTemplate={downloadSampleExcelTemplate}
        onLoadSampleData={handleLoadSampleLeads}
        onOpenUpload={() => setShowUploadModal(true)}
        contactCount={contacts.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Floating Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-xl shadow-lg border text-xs font-medium flex items-center justify-between animate-in slide-in-from-top-3 ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
                : notification.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
                : 'bg-indigo-950/90 text-indigo-200 border-indigo-500/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : notification.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Gmail Auth Reminder Banner if not connected */}
        {!authState.isAuthenticated && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900 to-indigo-950/40 border border-red-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Connect your Gmail Account (<span className="text-indigo-300 font-mono">graphicspunching264@gmail.com</span>)
                </h4>
                <p className="text-xs text-slate-400">
                  Authenticate via Google OAuth 2.0 to send emails directly to imported business contacts without copying &amp; pasting.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 flex-shrink-0">
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
                title="If your browser blocks popup windows in the iframe preview, open in a full window tab"
              >
                <span>Open in Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleConnectGmail}
                disabled={authState.isLoading}
                className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-md shadow-red-900/30 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                <span>Connect Gmail Account</span>
              </button>
            </div>
          </div>
        )}

        {/* Metrics Overview Cards */}
        <StatsCards
          contacts={contacts}
          activeFilter={activeFilter}
          onFilterChange={(filter) => {
            setActiveFilter(filter);
            setActiveTab('contacts');
          }}
        />

        {/* Navigation Tabs (Dashboard vs Replies vs Delivery Logs) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                activeTab === 'contacts'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Outreach Dashboard &amp; Composer</span>
            </button>

            {/* Replies & Inbox Tab */}
            <button
              id="tab-replies-inbox"
              onClick={() => setActiveTab('replies')}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer relative ${
                activeTab === 'replies'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Inbox className="w-4 h-4 text-emerald-400" />
              <span>Replies &amp; Inbox</span>
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {replies.length}
              </span>
              {replies.filter((r) => !r.isRead).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Delivery Logs ({sendLogs.length})</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              Import Leads (.xlsx)
            </button>
          </div>
        </div>

        {/* Primary Content View */}
        {activeTab === 'contacts' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Business Contacts Table (7 cols) */}
            <div className="lg:col-span-7 h-[700px]">
              <ContactTable
                contacts={contacts}
                selectedContactIds={selectedContactIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onComposeForContact={(contact) => {
                  setFocusedContact(contact);
                  setSelectedContactIds(new Set([contact.id]));
                }}
                onSendSingle={handleSendSingleContact}
                onEditContact={(contact) => setEditingContact(contact)}
                onDeleteContact={handleDeleteContact}
                onDeleteSelected={handleDeleteSelectedContacts}
                onClearAllContacts={handleClearAllContacts}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                isSendingBatch={isSendingBatch}
              />
            </div>

            {/* Right Column: Email Composer (5 cols) */}
            <div className="lg:col-span-5 h-[700px]">
              <EmailComposer
                selectedContacts={selectedContactsList}
                focusedContact={focusedContact}
                onOpenPreview={handleOpenPreview}
                onInitiateSend={handleInitiateSend}
                isSending={isSendingBatch}
                isAuthenticated={authState.isAuthenticated}
                senderEmail={authState.user?.email || SENDER_EMAIL}
                onConnectGmail={handleConnectGmail}
              />
            </div>
          </div>
        )}

        {/* Replies & Inbox View */}
        {activeTab === 'replies' && (
          <RepliesViewer
            replies={replies}
            isLoading={isFetchingReplies}
            onRefreshReplies={handleRefreshReplies}
            isAuthenticated={authState.isAuthenticated}
            accessToken={authState.accessToken}
            senderEmail={authState.user?.email || SENDER_EMAIL}
            onConnectGmail={handleConnectGmail}
            onSelectContact={handleSelectContactFromReply}
            onRepliesUpdated={(updated) => setReplies(updated)}
          />
        )}

        {/* Delivery Logs View */}
        {activeTab === 'logs' && (
          <div className="h-[650px]">
            <SendLogViewer
              logs={sendLogs}
              onClearLogs={() => {
                setSendLogs([]);
                setNotification({
                  type: 'info',
                  message: 'Outreach delivery logs cleared.',
                });
              }}
            />
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="max-w-2xl w-full">
            <ExcelUploader
              onImportSuccess={handleImportSuccess}
              onClose={() => setShowUploadModal(false)}
              isModal={true}
            />
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <EditContactModal
          contact={editingContact}
          onSave={handleEditContactSave}
          onClose={() => setEditingContact(null)}
        />
      )}

      {/* Live Email Preview Modal */}
      {previewData && (
        <EmailPreviewModal
          contact={previewData.contact}
          subject={previewData.subject}
          body={previewData.body}
          attachments={previewData.attachments}
          senderEmail={authState.user?.email || SENDER_EMAIL}
          onConfirmSend={() => {
            const targetContact = previewData.contact;
            setPreviewData(null);
            setConfirmSendData({
              contacts: [targetContact],
              subject: previewData.subject,
              bodyTemplate: previewData.body,
              attachments: previewData.attachments,
            });
          }}
          onClose={() => setPreviewData(null)}
          isSending={isSendingBatch}
        />
      )}

      {/* Confirm Send Modal (Workspace Destructive Mutation Requirement) */}
      {confirmSendData && (
        <ConfirmSendModal
          contacts={confirmSendData.contacts}
          subject={confirmSendData.subject}
          senderEmail={authState.user?.email || SENDER_EMAIL}
          attachments={confirmSendData.attachments}
          onConfirm={executeBatchSend}
          onCancel={() => setConfirmSendData(null)}
          isSending={isSendingBatch}
        />
      )}

      {/* Batch Send Progress Overlay Modal */}
      <SendProgressModal
        isOpen={batchProgress.isOpen}
        total={batchProgress.total}
        currentProgress={batchProgress.currentProgress}
        currentContactName={batchProgress.currentContactName}
        currentContactEmail={batchProgress.currentContactEmail}
        successCount={batchProgress.successCount}
        failCount={batchProgress.failCount}
        isComplete={batchProgress.isComplete}
        logs={sendLogs}
        onClose={() =>
          setBatchProgress((prev) => ({ ...prev, isOpen: false }))
        }
        onCancel={() => {
          cancelBatchRef.current = true;
          setBatchProgress((prev) => ({ ...prev, isComplete: true }));
        }}
      />
    </div>
  );
}
