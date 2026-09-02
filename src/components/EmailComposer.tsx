import React, { useState, useRef } from 'react';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  File,
  X,
  Eye,
  Sparkles,
  AlertCircle,
  FileText,
  Trash2,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { BusinessContact, EmailAttachment, EmailTemplate } from '../types';
import { DEFAULT_TEMPLATES, personalizeEmail, personalizeSubject, SENDER_EMAIL } from '../services/templateService';

interface EmailComposerProps {
  selectedContacts: BusinessContact[];
  focusedContact: BusinessContact | null;
  onOpenPreview: (renderedSubject: string, renderedBody: string, attachments: EmailAttachment[]) => void;
  onInitiateSend: (subject: string, bodyTemplate: string, attachments: EmailAttachment[]) => void;
  isSending: boolean;
  isAuthenticated: boolean;
  senderEmail: string;
  onConnectGmail: () => void;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  selectedContacts,
  focusedContact,
  onOpenPreview,
  onInitiateSend,
  isSending,
  isAuthenticated,
  senderEmail,
  onConnectGmail,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('default-outreach');
  const [subject, setSubject] = useState<string>(DEFAULT_TEMPLATES[0].subject);
  const [bodyText, setBodyText] = useState<string>(DEFAULT_TEMPLATES[0].body);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [isAttaching, setIsAttaching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active contact for preview calculation
  const targetContact = focusedContact || selectedContacts[0] || {
    id: 'sample',
    ownerName: 'Michael Roberts',
    businessName: 'Apex Screen Printing & Embroidery',
    email: 'michael@apexapparelprints.com',
    phone: '(555) 234-5678',
    address: 'Austin, TX',
    isValidEmail: true,
    sendStatus: 'pending',
  };

  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = DEFAULT_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      setSubject(tpl.subject);
      setBodyText(tpl.body);
    }
  };

  // Process file attachments (convert to base64)
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsAttaching(true);

    const newAttachments: EmailAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Limit attachment size (e.g. 15MB total per email)
      if (file.size > 15 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 15MB size limit.`);
        continue;
      }

      const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
      const isDoc = /\.(pdf|doc|docx|txt|ai|eps|dst|pes|emb|cdr)$/i.test(file.name);

      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            // Remove data:contentType;base64, prefix
            const base64 = res.split(',')[1] || '';
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const previewUrl = isImage ? URL.createObjectURL(file) : undefined;

        newAttachments.push({
          id: `att_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
          dataBase64: base64Data,
          previewUrl,
          fileType: isImage ? 'image' : isDoc ? 'document' : 'other',
        });
      } catch (err) {
        console.error('Error reading attachment:', file.name, err);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    setIsAttaching(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Personalized preview for currently selected / sample contact
  const personalizedPreview = personalizeEmail(bodyText, targetContact);
  const personalizedSubjectLine = personalizeSubject(subject, targetContact);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Insert token into body
  const insertToken = (token: string) => {
    setBodyText((prev) => prev + ` ${token} `);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Email Outreach Composer
            </h3>
            <p className="text-[11px] text-slate-500">
              Personalized vectorization &amp; digitizing pitch
            </p>
          </div>
        </div>

        {/* Template Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
            >
              {DEFAULT_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Composer Form Area */}
      <div className="p-4 flex-1 space-y-3 overflow-y-auto">
        {/* Sender & Recipient Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-slate-500 font-medium">From (Gmail):</span>
            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[200px]">
              {senderEmail || SENDER_EMAIL}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Recipients:</span>
            <span className="font-semibold text-slate-900 dark:text-white truncate">
              {selectedContacts.length > 0
                ? `${selectedContacts.length} business${selectedContacts.length > 1 ? 'es' : ''} selected`
                : focusedContact
                ? focusedContact.businessName
                : '1 Lead (Active Preview)'}
            </span>
          </div>
        </div>

        {/* Subject Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Subject Line
            </label>
            <span className="text-[11px] text-slate-400">
              Supports <code className="text-indigo-500">&#123;BUSINESS_NAME&#125;</code>
            </span>
          </div>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject of your email..."
            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Dynamic Tokens Pill Bar */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" /> Insert Variable:
          </span>
          <button
            type="button"
            onClick={() => insertToken('{GREETING}')}
            className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono transition-colors"
            title="Auto: 'Hi John,' or 'Hi,' if owner name is missing"
          >
            &#123;GREETING&#125;
          </button>
          <button
            type="button"
            onClick={() => insertToken('{BUSINESS_NAME}')}
            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono transition-colors"
          >
            &#123;BUSINESS_NAME&#125;
          </button>
          <button
            type="button"
            onClick={() => insertToken('{OWNER_NAME}')}
            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono transition-colors"
          >
            &#123;OWNER_NAME&#125;
          </button>
          <button
            type="button"
            onClick={() => insertToken('{WEBSITE}')}
            className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono transition-colors"
            title="Inserts website link"
          >
            &#123;WEBSITE&#125;
          </button>
          <button
            type="button"
            onClick={() => insertToken('{SENDER_EMAIL}')}
            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono transition-colors"
            title="Inserts sender email"
          >
            &#123;SENDER_EMAIL&#125;
          </button>
        </div>

        {/* Email Body Textarea */}
        <div className="relative">
          <textarea
            rows={7}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="Write your email pitch here..."
            className="w-full px-3.5 py-2.5 text-xs font-mono leading-relaxed rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Attachments Section */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Paperclip className="w-4 h-4 text-indigo-500" />
              <span>Attached Files &amp; Sample Artwork</span>
              <span className="text-[11px] font-normal text-slate-400">
                ({attachments.length} attached)
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.ai,.eps,.dst,.pes,.emb,.cdr,.svg"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAttaching}
              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800/60 transition-colors cursor-pointer"
            >
              <Paperclip className="w-3 h-3 mr-1" />
              {isAttaching ? 'Attaching...' : 'Add Image / File'}
            </button>
          </div>

          {/* Attachments List */}
          {attachments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs group"
                >
                  {/* Thumbnail / Icon */}
                  {att.previewUrl ? (
                    <img
                      src={att.previewUrl}
                      alt={att.filename}
                      className="w-8 h-8 rounded object-cover border border-slate-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                      <File className="w-4 h-4" />
                    </div>
                  )}

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={att.filename}>
                      {att.filename}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatFileSize(att.size)}</p>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              Attach sample vector conversions, 3D puff stitch samples, or price sheets to send with your email.
            </p>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() =>
            onOpenPreview(personalizedSubjectLine, personalizedPreview.body, attachments)
          }
          className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-xl transition-colors"
        >
          <Eye className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
          Preview Live Email
        </button>

        <div className="flex items-center space-x-2">
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={onConnectGmail}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              Connect Gmail to Send
            </button>
          ) : (
            <button
              type="button"
              id="btn-send-outreach"
              disabled={isSending || (selectedContacts.length === 0 && !focusedContact)}
              onClick={() => onInitiateSend(subject, bodyText, attachments)}
              className={`inline-flex items-center px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all ${
                isSending || (selectedContacts.length === 0 && !focusedContact)
                  ? 'bg-indigo-400 dark:bg-indigo-800 opacity-60 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/20 active:scale-[0.98] cursor-pointer'
              }`}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {isSending
                ? 'Sending in Progress...'
                : selectedContacts.length > 1
                ? `Send to ${selectedContacts.length} Selected Businesses`
                : selectedContacts.length === 1
                ? `Send to ${selectedContacts[0].businessName}`
                : focusedContact
                ? `Send to ${focusedContact.businessName}`
                : 'Select Businesses to Send'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
