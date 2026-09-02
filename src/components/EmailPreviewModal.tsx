import React, { useState } from 'react';
import { X, Send, Paperclip, CheckCircle, Mail, Monitor, Smartphone, File } from 'lucide-react';
import { BusinessContact, EmailAttachment } from '../types';
import { SENDER_EMAIL } from '../services/templateService';

interface EmailPreviewModalProps {
  contact: BusinessContact;
  subject: string;
  body: string;
  attachments: EmailAttachment[];
  onConfirmSend: () => void;
  onClose: () => void;
  isSending: boolean;
  senderEmail: string;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  contact,
  subject,
  body,
  attachments,
  onConfirmSend,
  onClose,
  isSending,
  senderEmail,
}) => {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all ${
          deviceView === 'desktop' ? 'max-w-3xl w-full h-[85vh]' : 'max-w-md w-full h-[85vh]'
        }`}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Email Client Preview
              </h3>
              <p className="text-[11px] text-slate-400">
                Exact message that will be delivered to {contact.businessName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Device Switcher */}
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-700 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setDeviceView('desktop')}
                className={`p-1.5 rounded-md ${
                  deviceView === 'desktop'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Desktop view"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceView('mobile')}
                className={`p-1.5 rounded-md ${
                  deviceView === 'mobile'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Mobile view"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Headers (Simulated Inbox View) */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 space-y-2 text-xs">
          <div className="flex items-start justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex-1">
              {subject || '(No Subject)'}
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Just now</span>
          </div>

          <div className="grid grid-cols-1 gap-1 pt-1 text-slate-600 dark:text-slate-300">
            <div className="flex items-center">
              <span className="w-14 font-semibold text-slate-400">From:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                Graphics Punching &lt;{senderEmail || SENDER_EMAIL}&gt;
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-14 font-semibold text-slate-400">To:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                {contact.ownerName ? `${contact.ownerName} • ` : ''}
                {contact.businessName} &lt;{contact.email}&gt;
              </span>
            </div>
          </div>
        </div>

        {/* Email Body Content */}
        <div className="p-6 flex-1 overflow-y-auto bg-white dark:bg-slate-900 space-y-6">
          <div className="prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
            {body}
          </div>

          {/* Attachments Display */}
          {attachments.length > 0 && (
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
                <Paperclip className="w-4 h-4 text-indigo-500" />
                <span>Attachments ({attachments.length})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center space-x-3"
                  >
                    {att.previewUrl ? (
                      <img
                        src={att.previewUrl}
                        alt={att.filename}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                        <File className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {att.filename}
                      </p>
                      <p className="text-[11px] text-slate-500">{formatFileSize(att.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Back to Editor
          </button>

          <button
            id="btn-confirm-send-preview"
            onClick={onConfirmSend}
            disabled={isSending || !contact.isValidEmail}
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? 'Sending...' : 'Send This Email Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
