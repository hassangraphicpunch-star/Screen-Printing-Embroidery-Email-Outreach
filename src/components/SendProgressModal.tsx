import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, X, Check, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SendLogEntry } from '../types';

interface SendProgressModalProps {
  isOpen: boolean;
  total: number;
  currentProgress: number;
  currentContactName: string;
  currentContactEmail: string;
  successCount: number;
  failCount: number;
  isComplete: boolean;
  onClose: () => void;
  onCancel: () => void;
  logs: SendLogEntry[];
}

export const SendProgressModal: React.FC<SendProgressModalProps> = ({
  isOpen,
  total,
  currentProgress,
  currentContactName,
  currentContactEmail,
  successCount,
  failCount,
  isComplete,
  onClose,
  onCancel,
  logs,
}) => {
  useEffect(() => {
    if (isComplete && successCount > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.error('Confetti error:', err);
      }
    }
  }, [isComplete, successCount]);

  if (!isOpen) return null;

  const percentage = total > 0 ? Math.round((currentProgress / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-2">
            {isComplete ? (
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isComplete ? 'Outreach Dispatch Completed' : 'Sending Outreach Emails...'}
              </h3>
              <p className="text-xs text-slate-500">
                {isComplete
                  ? `Finished processing ${total} email(s)`
                  : `Processing ${currentProgress} of ${total}`}
              </p>
            </div>
          </div>

          {isComplete && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Overall Progress</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Current Target Indicator */}
          {!isComplete && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Currently Dispatching
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {currentContactName || 'Preparing email...'}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono truncate">
                {currentContactEmail}
              </p>
            </div>
          )}

          {/* Metrics Counters */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Successfully Sent
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {successCount}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50">
              <span className="text-xs font-medium text-rose-700 dark:text-rose-400">
                Failed / Errors
              </span>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {failCount}
              </p>
            </div>
          </div>

          {/* Recent Live Logs */}
          <div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
              Live Dispatch Activity:
            </span>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 p-2 space-y-1.5 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
              {logs.length === 0 ? (
                <div className="text-slate-400 text-center py-4 text-xs">
                  Initiating connection with Gmail API...
                </div>
              ) : (
                logs.slice(-15).reverse().map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                      log.status === 'success'
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold truncate">
                        {log.businessName}
                      </p>
                      <p className="font-mono text-[11px] opacity-80 truncate">{log.recipientEmail}</p>
                      {log.errorMessage && (
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
                          {log.errorMessage}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
                      {log.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-end">
          {isComplete ? (
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors"
            >
              Close and View Results
            </button>
          ) : (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
            >
              Cancel Remaining
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
