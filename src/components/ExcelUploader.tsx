import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, Sparkles, Check, AlertCircle, X } from 'lucide-react';
import { parseExcelFile, downloadSampleExcelTemplate, SAMPLE_SCREEN_PRINTING_CONTACTS } from '../services/excelParser';
import { BusinessContact } from '../types';

interface ExcelUploaderProps {
  onImportSuccess: (contacts: BusinessContact[], append: boolean) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({
  onImportSuccess,
  onClose,
  isModal = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<{
    contacts: BusinessContact[];
    sheetName: string;
    totalRows: number;
    filename: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        throw new Error('Please upload an Excel spreadsheet (.xlsx, .xls) or CSV file.');
      }

      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(buffer);

      if (result.contacts.length === 0) {
        throw new Error('No valid business rows found in the sheet. Please ensure columns include Business Name, Email, and Owner Name.');
      }

      setPreviewResult({
        ...result,
        filename: file.name,
      });
    } catch (err: any) {
      console.error('File parsing error:', err);
      setError(err?.message || 'Failed to read the Excel file. Please verify the format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const confirmImport = (append: boolean) => {
    if (!previewResult) return;
    onImportSuccess(previewResult.contacts, append);
    setPreviewResult(null);
    if (onClose) onClose();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Import Screen Printing & Embroidery Leads
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload .xlsx or .xls file with Business Name, Owner Name, Email, Phone, and Address
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Upload / Drag Drop Area */}
      {!previewResult ? (
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleFileInputChange}
            />

            <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-7 h-7" />
              )}
            </div>

            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {isProcessing ? 'Analyzing Excel structure...' : 'Click to select or drag and drop your Excel file'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports .xlsx, .xls, and .csv formats
            </p>

            {/* Expected Columns Pill list */}
            <div className="mt-4 flex flex-wrap justify-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">Business Owner Name</span>
              <span className="bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">Business Name</span>
              <span className="bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">Email Address</span>
              <span className="bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">Phone Number</span>
              <span className="bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">Address</span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 flex items-start space-x-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
              <div>
                <span className="font-semibold">Import Error: </span>
                {error}
              </div>
            </div>
          )}

          {/* Helper Tools */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadSampleExcelTemplate();
              }}
              className="inline-flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download Ready-to-Use Excel Template
            </button>

            <button
              onClick={() => {
                onImportSuccess(SAMPLE_SCREEN_PRINTING_CONTACTS, false);
                if (onClose) onClose();
              }}
              className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Load Sample Leads (6 Shops)
            </button>
          </div>
        </div>
      ) : (
        /* Parsed Preview Verification */
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">File Verified</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-sm">
                  {previewResult.filename}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sheet: <span className="font-mono">{previewResult.sheetName}</span> • Total Rows: {previewResult.totalRows}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                {previewResult.contacts.length} Contacts Ready
              </span>
            </div>

            {/* Preview table snippet */}
            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0">
                  <tr>
                    <th className="p-2">Owner Name</th>
                    <th className="p-2">Business Name</th>
                    <th className="p-2">Email Address</th>
                    <th className="p-2">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {previewResult.contacts.slice(0, 5).map((contact, idx) => (
                    <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                      <td className="p-2 font-medium">
                        {contact.ownerName ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{contact.ownerName}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">[Blank - will use &quot;Hi,&quot;]</span>
                        )}
                      </td>
                      <td className="p-2 font-medium truncate max-w-[150px]">{contact.businessName}</td>
                      <td className="p-2 font-mono">
                        {contact.isValidEmail ? (
                          <span className="text-emerald-600 dark:text-emerald-400">{contact.email}</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 line-through">{contact.email || '[Missing]'}</span>
                        )}
                      </td>
                      <td className="p-2 text-slate-500 truncate">{contact.phone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewResult.contacts.length > 5 && (
              <p className="text-[11px] text-slate-500 text-center mt-2">
                + and {previewResult.contacts.length - 5} more business rows
              </p>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => setPreviewResult(null)}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Choose Different File
            </button>
            <button
              onClick={() => confirmImport(true)}
              className="px-3.5 py-2 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors"
            >
              Append to Existing List
            </button>
            <button
              onClick={() => confirmImport(false)}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Replace &amp; Import ({previewResult.contacts.length})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
