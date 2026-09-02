import React, { useState } from 'react';
import {
  Inbox,
  RefreshCw,
  Search,
  MessageSquare,
  Sparkles,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Clock,
  User,
  Building2,
  Mail,
  X,
  FileText,
  BadgePercent,
  Check,
} from 'lucide-react';
import { BusinessContact, EmailAttachment, EmailReply } from '../types';
import { sendGmailMessage } from '../services/gmailApi';
import { SENDER_EMAIL } from '../services/templateService';

interface RepliesViewerProps {
  replies: EmailReply[];
  isLoading: boolean;
  onRefreshReplies: () => void;
  isAuthenticated: boolean;
  accessToken: string | null;
  senderEmail?: string;
  onConnectGmail?: () => void;
  onSelectContact?: (contact: BusinessContact) => void;
  onRepliesUpdated: (newReplies: EmailReply[]) => void;
}

export const RepliesViewer: React.FC<RepliesViewerProps> = ({
  replies,
  isLoading,
  onRefreshReplies,
  isAuthenticated,
  accessToken,
  senderEmail = SENDER_EMAIL,
  onConnectGmail,
  onSelectContact,
  onRepliesUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'leads' | 'interested' | 'unread'>('all');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  // Quick Reply Composer State
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySuccessMessage, setReplySuccessMessage] = useState<string | null>(null);
  const [replyErrorMessage, setReplyErrorMessage] = useState<string | null>(null);

  const selectedReply = replies.find((r) => r.id === activeReplyId) || (replies.length > 0 ? replies[0] : null);

  // Filter replies
  const filteredReplies = replies.filter((reply) => {
    // Search query filter
    const matchesSearch =
      searchTerm === '' ||
      reply.fromName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.fromEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.snippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reply.matchedContact?.businessName || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'leads') {
      return !!reply.matchedContact;
    }
    if (selectedFilter === 'interested') {
      return reply.sentiment === 'interested' || reply.sentiment === 'quote_request';
    }
    if (selectedFilter === 'unread') {
      return !reply.isRead;
    }
    return true;
  });

  const handleMarkAsRead = (id: string, read: boolean) => {
    const updated = replies.map((r) => (r.id === id ? { ...r, isRead: read } : r));
    onRepliesUpdated(updated);
  };

  const handleSendQuickReply = async () => {
    if (!selectedReply || !replyText.trim() || !accessToken) return;

    setIsSendingReply(true);
    setReplyErrorMessage(null);
    setReplySuccessMessage(null);

    try {
      const subject = selectedReply.subject.toLowerCase().startsWith('re:')
        ? selectedReply.subject
        : `Re: ${selectedReply.subject}`;

      await sendGmailMessage(accessToken, {
        to: selectedReply.fromEmail,
        fromEmail: senderEmail || SENDER_EMAIL,
        fromName: 'Graphics Punching',
        subject,
        bodyText: replyText,
        threadId: selectedReply.threadId,
        inReplyTo: selectedReply.messageIdHeader,
        references: selectedReply.messageIdHeader,
      });

      setReplySuccessMessage(`Reply sent to ${selectedReply.fromEmail} from ${senderEmail || SENDER_EMAIL}!`);
      setReplyText('');
      // Mark as read automatically
      handleMarkAsRead(selectedReply.id, true);
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      setReplyErrorMessage(err?.message || 'Failed to send reply via Gmail.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const getSentimentBadge = (sentiment?: string) => {
    switch (sentiment) {
      case 'interested':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
            🔥 Interested Lead
          </span>
        );
      case 'quote_request':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
            💰 Quote Requested
          </span>
        );
      case 'inquiry':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
            ❓ Question / Inquiry
          </span>
        );
      case 'unsubscribed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            🚫 Unsubscribe
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            💬 Incoming Reply
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-[700px] overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/40">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Replies &amp; Inbox
              </h3>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                {replies.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live responses &amp; inquiries from screen printing and embroidery leads
            </p>
          </div>
        </div>

        {/* Connected Gmail Info & Sync Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-500">Connected:</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {senderEmail || SENDER_EMAIL}
            </span>
          </div>

          {!isAuthenticated && onConnectGmail && (
            <button
              type="button"
              onClick={onConnectGmail}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-white bg-red-600 hover:bg-red-500 shadow-xs cursor-pointer transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Connect Gmail</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRefreshReplies}
            disabled={isLoading || !isAuthenticated}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isLoading ? 'Checking Gmail...' : 'Sync Gmail Replies'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All ({replies.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('leads')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              selectedFilter === 'leads'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Matched Leads ({replies.filter((r) => r.matchedContact).length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('interested')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              selectedFilter === 'interested'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Interested / Quotes ({replies.filter((r) => r.sentiment === 'interested' || r.sentiment === 'quote_request').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('unread')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              selectedFilter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Unread ({replies.filter((r) => !r.isRead).length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search replies, sender, business..."
            className="w-full pl-8 pr-3 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Two-Column Layout (List + Detail) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Replies List */}
        <div className="w-full md:w-5/12 lg:w-4/12 border-r border-slate-200 dark:border-slate-800 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredReplies.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium">No matching replies found</p>
              {!isAuthenticated ? (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Connect your Gmail account to sync incoming replies in real-time.
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Click &quot;Sync Gmail Replies&quot; above to check your Gmail inbox.
                </p>
              )}
            </div>
          ) : (
            filteredReplies.map((reply) => {
              const isSelected = selectedReply?.id === reply.id;
              return (
                <button
                  key={reply.id}
                  type="button"
                  onClick={() => {
                    setActiveReplyId(reply.id);
                    handleMarkAsRead(reply.id, true);
                  }}
                  className={`w-full p-3.5 text-left transition-colors flex flex-col space-y-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  } ${!reply.isRead ? 'font-semibold bg-slate-50/80 dark:bg-slate-800/30' : ''}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center space-x-1.5 truncate">
                      {!reply.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0"></span>
                      )}
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {reply.fromName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 whitespace-nowrap">
                      {reply.date.split(',')[0]}
                    </span>
                  </div>

                  {reply.matchedContact && (
                    <div className="flex items-center space-x-1 text-[11px] text-indigo-600 dark:text-indigo-400">
                      <Building2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate font-medium">{reply.matchedContact.businessName}</span>
                    </div>
                  )}

                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {reply.subject}
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {reply.snippet}
                  </p>

                  <div className="pt-1 flex items-center justify-between">
                    {getSentimentBadge(reply.sentiment)}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Selected Reply Viewer & In-App Reply Composer */}
        <div className="hidden md:flex flex-1 flex-col overflow-y-auto bg-slate-50/30 dark:bg-slate-900/30">
          {selectedReply ? (
            <div className="flex-1 flex flex-col justify-between p-6 space-y-6">
              {/* Message Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      {selectedReply.subject}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>Thread ID: <span className="font-mono">{selectedReply.threadId.slice(0, 10)}...</span></span>
                      <span>•</span>
                      <span>{selectedReply.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={`https://mail.google.com/mail/u/0/#inbox/${selectedReply.threadId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Open in Gmail"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Sender Lead Info Card */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
                      {selectedReply.fromName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {selectedReply.fromName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {selectedReply.fromEmail}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {selectedReply.matchedContact ? (
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/50 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Matched: {selectedReply.matchedContact.businessName}</span>
                        </span>
                        {onSelectContact && (
                          <button
                            type="button"
                            onClick={() => onSelectContact(selectedReply.matchedContact!)}
                            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold underline hover:text-indigo-700 cursor-pointer"
                          >
                            View Lead
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Unmatched sender
                      </span>
                    )}
                    {getSentimentBadge(selectedReply.sentiment)}
                  </div>
                </div>

                {/* Message Body Box */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
                  {selectedReply.bodyHtml ? (
                    <div
                      className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed max-w-none overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: selectedReply.bodyHtml }}
                    />
                  ) : (
                    <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {selectedReply.bodyText}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Reply Form */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4 text-indigo-600" />
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Quick In-App Reply to {selectedReply.fromEmail}
                    </h5>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                    <span>From:</span>
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {senderEmail || SENDER_EMAIL}
                    </span>
                  </div>
                </div>

                {replySuccessMessage && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center space-x-2 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{replySuccessMessage}</span>
                  </div>
                )}

                {replyErrorMessage && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center space-x-2 border border-rose-200 dark:border-rose-800">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{replyErrorMessage}</span>
                  </div>
                )}

                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Hi ${selectedReply.fromName},\n\nThank you for getting in touch! Here are our sample vector & digitizing proofs...`}
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 resize-none font-sans"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                    <span>Replies are synced into the original Gmail thread automatically.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendQuickReply}
                    disabled={isSendingReply || !replyText.trim() || !isAuthenticated}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingReply ? 'Sending...' : 'Send Reply via Gmail'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
              <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-medium">Select a reply from the left to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
