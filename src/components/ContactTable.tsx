import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckSquare,
  Square,
  Send,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Eye,
  Filter,
  Copy,
  Check,
} from 'lucide-react';
import { BusinessContact } from '../types';

interface ContactTableProps {
  contacts: BusinessContact[];
  selectedContactIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onDeselectAll: () => void;
  onComposeForContact: (contact: BusinessContact) => void;
  onSendSingle: (contact: BusinessContact) => void;
  onEditContact: (contact: BusinessContact) => void;
  onDeleteContact: (id: string) => void;
  onDeleteSelected?: (ids: string[]) => void;
  onClearAllContacts: () => void;
  activeFilter: 'all' | 'valid' | 'invalid' | 'sent' | 'pending';
  onFilterChange: (filter: 'all' | 'valid' | 'invalid' | 'sent' | 'pending') => void;
  isSendingBatch: boolean;
}

export const ContactTable: React.FC<ContactTableProps> = ({
  contacts,
  selectedContactIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onComposeForContact,
  onSendSingle,
  onEditContact,
  onDeleteContact,
  onDeleteSelected,
  onClearAllContacts,
  activeFilter,
  onFilterChange,
  isSendingBatch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showDeleteSelectedConfirmModal, setShowDeleteSelectedConfirmModal] = useState(false);

  // Filter contacts by active status filter and search query
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // 1. Status filter
      if (activeFilter === 'valid' && !contact.isValidEmail) return false;
      if (activeFilter === 'invalid' && contact.isValidEmail) return false;
      if (activeFilter === 'sent' && contact.sendStatus !== 'sent') return false;
      if (activeFilter === 'pending' && (contact.sendStatus === 'sent' || !contact.isValidEmail)) return false;

      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        contact.businessName.toLowerCase().includes(query) ||
        contact.ownerName.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.phone.toLowerCase().includes(query) ||
        contact.address.toLowerCase().includes(query)
      );
    });
  }, [contacts, activeFilter, searchQuery]);

  const allFilteredSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((c) => selectedContactIds.has(c.id));

  const someFilteredSelected =
    filteredContacts.some((c) => selectedContactIds.has(c.id)) && !allFilteredSelected;

  const handleMasterToggle = () => {
    if (allFilteredSelected) {
      onDeselectAll();
    } else {
      const validFilteredIds = filteredContacts
        .filter((c) => c.isValidEmail)
        .map((c) => c.id);
      onSelectAll(validFilteredIds);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Top Action Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by business, owner name, email, phone, city..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Badges and Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Tabs */}
          <div className="flex items-center bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({contacts.length})
            </button>
            <button
              onClick={() => onFilterChange('valid')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeFilter === 'valid'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-500'
              }`}
            >
              Valid ({contacts.filter((c) => c.isValidEmail).length})
            </button>
            <button
              onClick={() => onFilterChange('invalid')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeFilter === 'invalid'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
              }`}
            >
              Invalid ({contacts.filter((c) => !c.isValidEmail).length})
            </button>
            <button
              onClick={() => onFilterChange('sent')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeFilter === 'sent'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-500'
              }`}
            >
              Sent ({contacts.filter((c) => c.sendStatus === 'sent').length})
            </button>
          </div>

          {/* Clear all contacts button */}
          {contacts.length > 0 && (
            <button
              onClick={() => setShowClearConfirmModal(true)}
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear all contacts"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Batch Summary Banner */}
      {selectedContactIds.size > 0 && (
        <div className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 border-b border-indigo-200 dark:border-indigo-800/40 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-900 dark:text-indigo-200 animate-in fade-in">
          <div className="flex items-center space-x-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>
              <strong>{selectedContactIds.size}</strong> business contact(s) selected
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Delete Selected Button */}
            <button
              onClick={() => {
                if (onDeleteSelected) {
                  setShowDeleteSelectedConfirmModal(true);
                } else {
                  Array.from(selectedContactIds).forEach((id) => onDeleteContact(id));
                  onDeselectAll();
                }
              }}
              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer"
              title="Delete selected contacts"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedContactIds.size})</span>
            </button>

            <button
              onClick={onDeselectAll}
              className="text-[11px] underline text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 overflow-x-auto min-h-[360px]">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center p-6 text-slate-500">
            <Filter className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No contacts found
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {searchQuery
                ? `No business records match "${searchQuery}". Try a different keyword.`
                : 'No contacts match the selected filter. Import an Excel file or load sample leads.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="p-3.5 w-10">
                  <button
                    onClick={handleMasterToggle}
                    className="flex items-center justify-center text-slate-500 hover:text-indigo-600"
                    title={allFilteredSelected ? 'Deselect All' : 'Select All Valid'}
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : someFilteredSelected ? (
                      <div className="w-4 h-4 bg-indigo-600 rounded-sm flex items-center justify-center text-white text-[10px]">
                        -
                      </div>
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Business Name</th>
                <th className="p-3.5">Owner Name</th>
                <th className="p-3.5">Email Address</th>
                <th className="p-3.5">Phone &amp; Address</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filteredContacts.map((contact) => {
                const isSelected = selectedContactIds.has(contact.id);

                return (
                  <tr
                    key={contact.id}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                      isSelected
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                        : contact.sendStatus === 'sent'
                        ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                        : !contact.isValidEmail
                        ? 'bg-amber-50/20 dark:bg-amber-950/10'
                        : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5">
                      <button
                        disabled={!contact.isValidEmail || isSendingBatch}
                        onClick={() => onToggleSelect(contact.id)}
                        className={`flex items-center justify-center ${
                          !contact.isValidEmail
                            ? 'opacity-30 cursor-not-allowed'
                            : 'cursor-pointer hover:text-indigo-600'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 whitespace-nowrap">
                      {contact.sendStatus === 'sent' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Sent
                        </span>
                      ) : contact.sendStatus === 'sending' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800 animate-pulse">
                          <Clock className="w-3 h-3 mr-1 animate-spin" />
                          Sending...
                        </span>
                      ) : contact.sendStatus === 'failed' ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800"
                          title={contact.sendError || 'Failed to send'}
                        >
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Failed
                        </span>
                      ) : !contact.isValidEmail ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800"
                          title={contact.validationError || 'Invalid email format'}
                        >
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Invalid Email
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          Ready
                        </span>
                      )}
                    </td>

                    {/* Business Name */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                        {contact.businessName}
                      </div>
                    </td>

                    {/* Owner Name (Rule: NEVER 'No' or 'N/A') */}
                    <td className="p-3.5">
                      {contact.ownerName ? (
                        <div className="flex items-center space-x-1 font-medium text-slate-900 dark:text-slate-100">
                          <span>{contact.ownerName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                          [Blank • Will greet as &quot;Hi,&quot;]
                        </span>
                      )}
                    </td>

                    {/* Email Address (Ensuring @ is visible & exact) */}
                    <td className="p-3.5 font-mono">
                      <div className="flex items-center space-x-1.5">
                        {contact.isValidEmail ? (
                          <span className="text-slate-800 dark:text-slate-200 font-semibold selection:bg-indigo-200">
                            {contact.email}
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-medium">
                            {contact.email ? contact.email : '[Missing Email]'}
                          </span>
                        )}
                        {contact.email && (
                          <button
                            onClick={() => copyToClipboard(contact.email, contact.id)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                            title="Copy email address"
                          >
                            {copiedId === contact.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                      {contact.validationError && (
                        <p className="text-[10px] text-rose-500 mt-0.5">
                          {contact.validationError}
                        </p>
                      )}
                    </td>

                    {/* Phone & Address */}
                    <td className="p-3.5 text-slate-500 max-w-[200px]">
                      {contact.phone && (
                        <div className="flex items-center text-[11px] truncate">
                          <Phone className="w-3 h-3 mr-1 text-slate-400 flex-shrink-0" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.address && (
                        <div className="flex items-center text-[11px] truncate text-slate-400">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{contact.address}</span>
                        </div>
                      )}
                      {!contact.phone && !contact.address && (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Select and Load in Composer */}
                        <button
                          onClick={() => onComposeForContact(contact)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Preview personalized email for this lead"
                        >
                          <Eye className="w-4 h-4 text-indigo-500" />
                        </button>

                        {/* Send Single Email */}
                        <button
                          disabled={!contact.isValidEmail || isSendingBatch}
                          onClick={() => onSendSingle(contact)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            contact.isValidEmail && !isSendingBatch
                              ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              : 'opacity-30 cursor-not-allowed text-slate-400'
                          }`}
                          title={
                            contact.sendStatus === 'sent'
                              ? 'Send again to this contact'
                              : 'Send email to this contact'
                          }
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        {/* Edit Contact */}
                        <button
                          onClick={() => onEditContact(contact)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit contact information"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Contact */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteContact(contact.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Remove from list"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Footer Stats */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing <strong>{filteredContacts.length}</strong> of <strong>{contacts.length}</strong> businesses
        </span>
        <span className="text-[11px] text-slate-400">
          Sender: <span className="text-indigo-500 font-mono">graphicspunching264@gmail.com</span>
        </span>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full shadow-2xl p-5 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Clear All Contacts?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                This will remove all {contacts.length} business lead(s) from your current list. You can re-import an Excel file or load samples anytime.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllContacts();
                  setShowClearConfirmModal(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Selected Confirmation Modal */}
      {showDeleteSelectedConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full shadow-2xl p-5 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Delete {selectedContactIds.size} Selected Contact(s)?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove the {selectedContactIds.size} selected business contact(s) from your outreach list?
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteSelectedConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteSelected) {
                    onDeleteSelected(Array.from(selectedContactIds));
                  } else {
                    Array.from(selectedContactIds).forEach((id) => onDeleteContact(id));
                    onDeselectAll();
                  }
                  setShowDeleteSelectedConfirmModal(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
