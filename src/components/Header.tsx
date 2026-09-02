import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, LogOut, Download, FileSpreadsheet, Sparkles, User as UserIcon } from 'lucide-react';
import { AuthState } from '../types';

interface HeaderProps {
  authState: AuthState;
  onConnectGmail: () => void;
  onDisconnectGmail: () => void;
  onReconnectGmail: () => void;
  onDownloadTemplate: () => void;
  onLoadSampleData: () => void;
  onOpenUpload: () => void;
  contactCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  authState,
  onConnectGmail,
  onDisconnectGmail,
  onReconnectGmail,
  onDownloadTemplate,
  onLoadSampleData,
  onOpenUpload,
  contactCount,
}) => {
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20 ring-1 ring-white/10">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Screen Printing & Embroidery
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Outreach Suite
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Vectorization & Digitizing Email System • <span className="text-indigo-400">graphicspunching264@gmail.com</span>
              </p>
            </div>
          </div>

          {/* Action Tools & Gmail Status */}
          <div className="flex items-center space-x-3">
            {/* Quick Actions */}
            <div className="hidden lg:flex items-center space-x-2">
              <button
                id="btn-download-template"
                onClick={onDownloadTemplate}
                className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors shadow-sm"
                title="Download formatted Excel template for contacts"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Excel Template
              </button>

              {contactCount === 0 && (
                <button
                  id="btn-load-sample"
                  onClick={onLoadSampleData}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 rounded-lg border border-cyan-800/60 transition-colors shadow-sm"
                  title="Load sample screen printing & embroidery leads for instant testing"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                  Load Sample Leads
                </button>
              )}

              <button
                id="btn-import-xlsx-header"
                onClick={onOpenUpload}
                className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                Import XLSX
              </button>
            </div>

            {/* Gmail Connection Component */}
            <div className="relative">
              {authState.isAuthenticated && authState.user ? (
                <div className="flex items-center space-x-2">
                  <div
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="flex items-center space-x-2.5 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/30 px-3 py-1.5 rounded-lg cursor-pointer transition-all shadow-sm group"
                  >
                    <div className="relative">
                      {authState.user.photoURL ? (
                        <img
                          src={authState.user.photoURL}
                          alt="Gmail Avatar"
                          className="w-7 h-7 rounded-full border border-emerald-400 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xs font-bold">
                          {authState.user.email ? authState.user.email[0].toUpperCase() : 'G'}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900"></span>
                    </div>

                    <div className="text-left hidden sm:block">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-semibold text-emerald-300">Gmail Connected</span>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </div>
                      <p className="text-[11px] text-slate-300 font-mono truncate max-w-[190px]">
                        {authState.user.email || 'graphicspunching264@gmail.com'}
                      </p>
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  {showAccountMenu && (
                    <div className="absolute right-0 mt-2 w-64 top-full bg-slate-800 rounded-xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2 border-b border-slate-700/60">
                        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                          Authenticated Sender
                        </p>
                        <p className="text-sm font-medium text-white truncate">{authState.user.displayName || 'Graphics Punching'}</p>
                        <p className="text-xs text-indigo-300 font-mono truncate">{authState.user.email}</p>
                      </div>

                      <div className="p-1 space-y-1">
                        <button
                          onClick={() => {
                            setShowAccountMenu(false);
                            onReconnectGmail();
                          }}
                          className="w-full flex items-center px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-2 text-blue-400" />
                          Reconnect / Refresh Token
                        </button>
                        <button
                          onClick={() => {
                            setShowAccountMenu(false);
                            onDisconnectGmail();
                          }}
                          className="w-full flex items-center px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5 mr-2 text-rose-400" />
                          Disconnect Gmail
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="btn-connect-gmail"
                  onClick={onConnectGmail}
                  disabled={authState.isLoading}
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.98] rounded-lg shadow-md shadow-red-900/30 border border-red-500/40 transition-all cursor-pointer"
                >
                  {authState.isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M24 12.276c0-.816-.067-1.636-.207-2.433H12.24v4.615h6.604c-.285 1.542-1.164 2.85-2.464 3.723v3.09h3.987c2.333-2.148 3.673-5.31 3.673-8.995z"
                        />
                        <path
                          fill="#34A853"
                          d="M12.24 24.238c3.308 0 6.082-1.097 8.11-2.967l-3.987-3.09c-1.098.736-2.502 1.17-4.123 1.17-3.17 0-5.856-2.14-6.814-5.024H1.27v3.189c2.025 4.02 6.184 6.722 10.97 6.722z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.426 14.327c-.246-.736-.388-1.524-.388-2.327s.142-1.591.388-2.327V6.484H1.27C.46 8.093 0 9.99 0 12s.46 3.907 1.27 5.516l4.156-3.189z"
                        />
                        <path
                          fill="#4285F4"
                          d="M12.24 4.757c1.798 0 3.412.618 4.68 1.832l3.51-3.51C18.318 1.175 15.544 0 12.24 0 7.454 0 3.295 2.702 1.27 6.722l4.156 3.189c.958-2.884 3.644-5.024 6.814-5.024z"
                        />
                      </svg>
                      Connect Gmail
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
