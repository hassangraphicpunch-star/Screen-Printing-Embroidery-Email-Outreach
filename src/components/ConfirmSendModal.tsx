import React from 'react';
import { AlertCircle, Send, X, ShieldAlert, Paperclip } from 'lucide-react';
import { BusinessContact, EmailAttachment } from '../types';

interface ConfirmSendModalProps {
  contacts: BusinessContact[];
  subject: string;
  senderEmail: string;
  attachments: EmailAttachment[];
  onConfirm: () => void;
  onCancel: () => void;
  isSending: boolean;
}

export const ConfirmSendModal: React.FC<ConfirmSendModalProps> = ({
  contacts,
  subject,
  senderEmail,
  attachments,
  onConfirm,
  onCancel,
  isSending,
}) => {
  const validContacts = contacts.filter((c) => c.isValidEmail);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Confirm Email Outreach Dispatch
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            You are about to send personalized outreach emails directly from your connected Gmail account:
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">From Account:</span>
              <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                {senderEmail}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Recipients:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {validContacts.length} business{validContacts.length > 1 ? 'es' : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Subject:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                {subject}
              </span>
            </div>
            {attachments.length > 0 && (
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5" /> Attachments:
                </span>
                <span className="font-bold">{attachments.length} file(s) included</span>
              </div>
            )}
          </div>

          {/* Recipient list snippet */}
          <div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
              Target Businesses ({validContacts.length}):
            </span>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 p-2 space-y-1 bg-white dark:bg-slate-800 text-xs">
              {validContacts.slice(0, 10).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="font-medium truncate max-w-[180px]">{c.businessName}</span>
                  <span className="font-mono text-slate-500 text-[11px] truncate max-w-[180px]">{c.email}</span>
                </div>
              ))}
              {validContacts.length > 10 && (
                <div className="text-[11px] text-slate-400 text-center pt-1">
                  + and {validContacts.length - 10} more businesses
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-start space-x-2 text-amber-800 dark:text-amber-300 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <p>
              Each email will be sent individually with a brief delay to respect Gmail rate limits and avoid spam filters.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSending}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-confirm-send-now"
            onClick={onConfirm}
            disabled={isSending || validContacts.length === 0}
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Outreach Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
