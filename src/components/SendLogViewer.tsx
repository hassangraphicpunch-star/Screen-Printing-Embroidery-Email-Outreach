import React, { useState } from 'react';
import { SendLogEntry } from '../types';
import { CheckCircle2, AlertCircle, Clock, Paperclip, Search, Download, Trash2 } from 'lucide-react';

interface SendLogViewerProps {
  logs: SendLogEntry[];
  onClearLogs: () => void;
  onRetryContact?: (recipientEmail: string) => void;
}

export const SendLogViewer: React.FC<SendLogViewerProps> = ({
  logs,
  onClearLogs,
  onRetryContact,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showClearLogsConfirm, setShowClearLogsConfirm] = useState(false);

  const filteredLogs = logs.filter(
    (log) =>
      log.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportLogsAsCSV = () => {
    if (logs.length === 0) return;
    const header = ['Timestamp', 'Business Name', 'Recipient Email', 'Subject', 'Status', 'Attachments', 'Error'];
    const rows = logs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.businessName.replace(/"/g, '""')}"`,
      `"${l.recipientEmail}"`,
      `"${l.subject.replace(/"/g, '""')}"`,
      `"${l.status}"`,
      l.attachmentCount,
      `"${(l.errorMessage || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `outreach_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Top Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Outreach Delivery Log
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
              {logs.length}
            </span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Real-time audit log of all emails sent through Gmail API
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {logs.length > 0 && (
            <>
              <button
                onClick={exportLogsAsCSV}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => setShowClearLogsConfirm(true)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title="Clear Logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Clear Logs Confirmation Modal */}
      {showClearLogsConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full shadow-2xl p-5 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Clear Outreach Logs?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to clear all {logs.length} logged email dispatch entries?
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearLogsConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearLogs();
                  setShowClearLogsConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Yes, Clear Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log list */}
      <div className="flex-1 overflow-x-auto p-4">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs font-medium">No outreach emails sent yet in this session.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Select contacts and click &quot;Send to Selected Businesses&quot; to begin dispatch.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-2.5">Time</th>
                <th className="p-2.5">Business &amp; Recipient</th>
                <th className="p-2.5">Subject</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Attachments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredLogs.slice().reverse().map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-2.5 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="p-2.5">
                    <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                      {log.businessName}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500 truncate max-w-[180px]">
                      {log.recipientEmail}
                    </p>
                  </td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                    {log.subject}
                  </td>
                  <td className="p-2.5 whitespace-nowrap">
                    {log.status === 'success' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Delivered
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800"
                        title={log.errorMessage}
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-500 whitespace-nowrap">
                    {log.attachmentCount > 0 ? (
                      <span className="inline-flex items-center text-[11px] text-indigo-600 dark:text-indigo-400">
                        <Paperclip className="w-3 h-3 mr-1" /> {log.attachmentCount} file(s)
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
