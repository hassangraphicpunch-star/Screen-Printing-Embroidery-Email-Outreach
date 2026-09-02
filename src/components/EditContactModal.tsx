import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { BusinessContact } from '../types';
import { sanitizeOwnerName, validateEmail } from '../services/excelParser';

interface EditContactModalProps {
  contact: BusinessContact;
  onSave: (updatedContact: BusinessContact) => void;
  onClose: () => void;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  contact,
  onSave,
  onClose,
}) => {
  const [ownerName, setOwnerName] = useState(contact.ownerName || '');
  const [businessName, setBusinessName] = useState(contact.businessName || '');
  const [email, setEmail] = useState(contact.email || '');
  const [phone, setPhone] = useState(contact.phone || '');
  const [address, setAddress] = useState(contact.address || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Sanitize owner name according to strict rules (no "No", "N/A")
    const cleanOwner = sanitizeOwnerName(ownerName);
    const emailValidation = validateEmail(email);

    if (!email.trim()) {
      setValidationError('Email address cannot be empty.');
      return;
    }

    const updated: BusinessContact = {
      ...contact,
      ownerName: cleanOwner,
      businessName: businessName.trim() || (cleanOwner ? `${cleanOwner}'s Business` : 'Screen Printing & Embroidery Shop'),
      email: emailValidation.email,
      phone: phone.trim(),
      address: address.trim(),
      isValidEmail: emailValidation.isValid,
      validationError: emailValidation.error,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Edit Business Lead Contact
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Business Owner Name
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Leave blank if unknown (will use 'Hi,')"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Note: Never use &quot;No&quot; or &quot;N/A&quot;. If left blank, email greeting will automatically format as &quot;Hi,&quot;.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Business / Company Name *
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Apex Screen Printing & Embroidery"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationError(null);
              }}
              placeholder="e.g. contact@businessprint.com"
              className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {validationError && (
              <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {validationError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City / Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="City, State"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
