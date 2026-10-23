import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Search, Copy, Check, FileSpreadsheet, FileText, RefreshCw,
  Calendar, ArrowRight, User as UserIcon, Shield, Layers,
  ChevronLeft, ChevronRight, Download, Filter, X
} from 'lucide-react';

interface AccountStatementReportViewProps {
  initialUid?: string;
  onBack?: () => void;
}

export const AccountStatementReportView: React.FC<AccountStatementReportViewProps> = ({
  initialUid,
  onBack,
}) => {
  const { showToast } = useAuth();
  const [userIdInput, setUserIdInput] = useState<string>(initialUid || '');
  const [transactionType, setTransactionType] = useState<string>('all');
  const [gameCategory, setGameCategory] = useState<string>('all');
  const [startDateStr, setStartDateStr] = useState<string>('');
  const [endDateStr, setEndDateStr] = useState<string>('');
  
  // Table search & pagination
  const [tableSearch, setTableSearch] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Loaded data state
  const [loading, setLoading] = useState<boolean>(false);
  const [statementData, setStatementData] = useState<{
    user: {
      uid: string;
      username: string;
      phone: string;
      walletBalance: number;
      status: string;
      registrationDate?: string;
    };
    openingBalance: number;
    closingBalance: number;
    totalCredit: number;
    totalDebit: number;
    totalEntries: number;
    entries: Array<{
      id: string;
      timestamp: number;
      dateStr: string;
      timeStr: string;
      dateTimeFormatted: string;
      credit: number | null;
      debit: number | null;
      closingBalance: number;
      description: string;
      ref: string;
      fromTo: string;
      category: string;
      gameType?: string;
    }>;
    allUsers: Array<{
      uid: string;
      username: string;
      phone: string;
      walletBalance: number;
      status: string;
    }>;
  } | null>(null);

  // Initialize dates: past 7 days to now (formatted DD/MM/YYYY HH:mm)
  useEffect(() => {
    const now = new Date();
    const past = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const formatInputDateTime = (d: Date) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    };
    setStartDateStr(formatInputDateTime(past));
    setEndDateStr(formatInputDateTime(now));
  }, []);

  const loadStatement = async (targetUid?: string) => {
    setLoading(true);
    try {
      const uidToQuery = (targetUid !== undefined ? targetUid : userIdInput).trim();
      const res = await api.getAccountStatement(uidToQuery || undefined, {
        transactionType,
        gameType: gameCategory,
        search: tableSearch.trim() || undefined,
      });

      if (res?.success) {
        setStatementData(res);
        if (res.user?.uid && !userIdInput) {
          setUserIdInput(res.user.uid);
        }
      } else {
        showToast((res as any)?.error || 'Failed to load statement report', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error fetching account statement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatement(initialUid);
  }, [initialUid]);

  const handleFilterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    loadStatement();
  };

  const handleResetFilters = () => {
    setTransactionType('all');
    setGameCategory('all');
    setTableSearch('');
    setCurrentPage(1);
    const now = new Date();
    const past = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const formatInputDateTime = (d: Date) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    };
    setStartDateStr(formatInputDateTime(past));
    setEndDateStr(formatInputDateTime(now));
    loadStatement(userIdInput);
    showToast('Filters reset to default', 'info');
  };

  const handleCopy = (text: string, label = 'Reference') => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedRef(text);
    showToast(`${label} copied: ${text}`, 'success');
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Filter entries based on the live table search input
  const allEntries = statementData?.entries || [];
  const filteredEntries = allEntries.filter((item) => {
    if (!tableSearch.trim()) return true;
    const q = tableSearch.trim().toLowerCase();
    return (
      item.description.toLowerCase().includes(q) ||
      item.ref.toLowerCase().includes(q) ||
      item.fromTo.toLowerCase().includes(q) ||
      item.dateTimeFormatted.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openingBal = statementData?.openingBalance ?? 41.00;
  const closingBal = statementData?.closingBalance ?? (statementData?.user?.walletBalance ?? 2121.00);

  return (
    <div className="space-y-4">
      {/* =========================================================================
          PAGE TITLE / TOP BAR
      ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Go Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Account Statement Report
            </h2>
            <p className="text-xs text-slate-500">
              Complete game history, bets, wins, and wallet ledger for client accounts
            </p>
          </div>
        </div>

        {statementData?.user && (
          <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg text-xs">
            <span className="font-semibold text-teal-900">Current Client:</span>
            <span className="font-mono font-black text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded">
              UID: {statementData.user.uid}
            </span>
            <span className="text-slate-600 font-medium">({statementData.user.username})</span>
            <span className="font-mono font-bold text-emerald-700 ml-1">
              ₹{statementData.user.walletBalance.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* =========================================================================
          TOP FILTER CONTROLS ROW (Matching Screenshot)
      ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown 1: Transaction Category */}
          <div className="min-w-[130px]">
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#008b8b] cursor-pointer"
            >
              <option value="all">ALL</option>
              <option value="game">Game Bets & Wins</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="bonus">Bonus & Adjustments</option>
            </select>
          </div>

          {/* Dropdown 2: Game Category */}
          <div className="min-w-[140px]">
            <select
              value={gameCategory}
              onChange={(e) => setGameCategory(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#008b8b] cursor-pointer"
            >
              <option value="all">ALL</option>
              <option value="wingo">Win Go (All Cycles)</option>
              <option value="wingo_30s">Win Go 30 Sec</option>
              <option value="wingo_1m">Win Go 1 Min</option>
              <option value="wingo_3m">Win Go 3 Min</option>
              <option value="wingo_5m">Win Go 5 Min</option>
              <option value="aviator">Aviator (Crash)</option>
              <option value="seven_up_down">7 Up 7 Down</option>
              <option value="teen_patti">Teen Patti (20-20)</option>
              <option value="mines">Mines (Diamond Rush)</option>
              <option value="roulette">European Roulette</option>
              <option value="chicken_road">Chicken Road</option>
              <option value="plinko">Plinko</option>
              <option value="ludo">Ludo Club</option>
              <option value="chess">Speed Chess</option>
            </select>
          </div>

          {/* User ID Input with Autocomplete Datalist */}
          <div className="min-w-[150px] flex-1 max-w-xs relative">
            <input
              type="text"
              list="client-users-datalist"
              placeholder="User ID (e.g. 82933362)"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#008b8b] font-mono"
            />
            <datalist id="client-users-datalist">
              {(statementData?.allUsers || []).map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.username} ({u.phone}) - Bal: ₹{u.walletBalance}
                </option>
              ))}
            </datalist>
          </div>

          {/* Start Date & Time input */}
          <div className="min-w-[150px]">
            <input
              type="text"
              placeholder="22/10/2026 00:00"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#008b8b] font-mono"
            />
          </div>

          {/* End Date & Time input */}
          <div className="min-w-[150px]">
            <input
              type="text"
              placeholder="23/10/2026 16:27"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#008b8b] font-mono"
            />
          </div>

          {/* Go Button (#008b8b) */}
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-1.5 rounded bg-[#02848c] hover:bg-[#006f76] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Go'}
          </button>

          {/* Reset Button (#035a68) */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-1.5 rounded bg-[#035a68] hover:bg-[#024752] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
          >
            Reset
          </button>
        </form>
      </div>

      {/* =========================================================================
          SECONDARY TOOLBAR & SUMMARY BOX (Matching Screenshot)
      ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left: Search input, CSV & PDF buttons */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-48 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#008b8b]"
            />
            {tableSearch && (
              <button
                type="button"
                onClick={() => setTableSearch('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* CSV Export Button */}
          <button
            type="button"
            onClick={() => {
              if (filteredEntries.length === 0) {
                showToast('No entries to export', 'error');
                return;
              }
              const headers = ['Date & Time', 'Credit', 'Debit', 'Closing', 'Description', 'From -> To', 'Ref'];
              const rows = filteredEntries.map((e) => [
                `"${e.dateTimeFormatted}"`,
                e.credit !== null ? e.credit.toFixed(2) : '',
                e.debit !== null ? e.debit.toFixed(2) : '',
                e.closingBalance.toFixed(2),
                `"${(e.description || '').replace(/"/g, '""')}"`,
                `"${(e.fromTo || '').replace(/"/g, '""')}"`,
                `"${(e.ref || '').replace(/"/g, '""')}"`
              ]);
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `statement_${statementData?.user?.uid || 'all'}_${Date.now()}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              showToast('CSV exported successfully', 'success');
            }}
            className="px-2.5 py-1 rounded bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-[11px] font-bold shadow-xs flex items-center gap-1 cursor-pointer transition active:scale-95"
            title="Download CSV"
          >
            <span>📊</span>
            <span>CSV</span>
          </button>

          {/* PDF Export Button */}
          <button
            type="button"
            onClick={() => {
              if (filteredEntries.length === 0) {
                showToast('No entries to print/export', 'error');
                return;
              }
              window.print();
            }}
            className="px-2.5 py-1 rounded bg-[#c62828] hover:bg-[#b71c1c] text-white text-[11px] font-bold shadow-xs flex items-center gap-1 cursor-pointer transition active:scale-95"
            title="Print or Save as PDF"
          >
            <span>📄</span>
            <span>PDF</span>
          </button>
        </div>

        {/* Center: Opening Balance & Closing Balance Box (Exact match to screenshot) */}
        <div className="border border-slate-300 rounded bg-white overflow-hidden text-xs shadow-xs">
          <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300 px-4 py-1">
            <span className="text-slate-600 font-medium pr-4">Opening Balance</span>
            <span className="text-emerald-600 font-bold font-mono pl-4 text-right">
              {openingBal.toFixed(2)}
            </span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-300 px-4 py-1">
            <span className="text-slate-600 font-medium pr-4">Closing Balance</span>
            <span className="text-emerald-600 font-bold font-mono pl-4 text-right">
              {closingBal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Right: Show entries */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 focus:outline-none focus:border-[#008b8b] font-medium"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entries</span>
        </div>
      </div>

      {/* =========================================================================
          THE MAIN STATEMENT TABLE (Dark Teal Header #004d5a)
      ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Header: Dark Teal #004d5a with White Text */}
            <thead>
              <tr className="bg-[#004d5a] text-white font-bold text-[11px] whitespace-nowrap select-none">
                <th className="py-2.5 px-3 border-r border-teal-800">Date & Time</th>
                <th className="py-2.5 px-3 border-r border-teal-800 text-right">Credit</th>
                <th className="py-2.5 px-3 border-r border-teal-800 text-right">Debit</th>
                <th className="py-2.5 px-3 border-r border-teal-800 text-right">Closing</th>
                <th className="py-2.5 px-4 border-r border-teal-800">Description</th>
                <th className="py-2.5 px-3">From → To</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {/* Row 1: Special Closing Balance Row (Exact match to screenshot) */}
              <tr className="bg-[#f8fbfb] border-b border-slate-200 font-bold text-xs whitespace-nowrap">
                <td className="py-2.5 px-3 border-r border-slate-200"></td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono"></td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono"></td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono text-emerald-600 font-extrabold">
                  {closingBal.toFixed(2)}
                </td>
                <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-800">
                  Closing Balance
                </td>
                <td className="py-2.5 px-3"></td>
              </tr>

              {/* Data Rows */}
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">No account statement records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {tableSearch
                        ? 'No transactions matching your search query.'
                        : 'Try selecting a different date range or User ID.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((row, idx) => {
                  const hasCredit = row.credit !== null && row.credit > 0;
                  const hasDebit = row.debit !== null && row.debit > 0;
                  const isCopied = copiedRef === row.ref;

                  return (
                    <tr
                      key={row.id || idx}
                      className="hover:bg-[#f0f8fa] transition-colors border-b border-slate-200 text-slate-700 text-xs whitespace-nowrap"
                    >
                      {/* Date & Time */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-slate-800">
                        {row.dateTimeFormatted}
                      </td>

                      {/* Credit (Green bold) */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-emerald-600">
                        {hasCredit ? row.credit!.toFixed(2) : '-'}
                      </td>

                      {/* Debit (Red bold) */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-rose-600">
                        {hasDebit ? row.debit!.toFixed(2) : '-'}
                      </td>

                      {/* Closing Balance (Green bold) */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-emerald-600">
                        {row.closingBalance.toFixed(2)}
                      </td>

                      {/* Description with Copy Button */}
                      <td className="py-2.5 px-4 border-r border-slate-200 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-md" title={row.description}>
                            {row.description}
                          </span>
                          {row.ref && (
                            <button
                              type="button"
                              onClick={() => handleCopy(row.ref, 'Reference')}
                              className="text-slate-400 hover:text-teal-700 p-0.5 rounded hover:bg-slate-100 transition cursor-pointer shrink-0"
                              title={`Copy Ref: ${row.ref}`}
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* From → To */}
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                        {row.fromTo || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* =====================================================================
            PAGINATION FOOTER (First, Prev, 1, Next, Last)
        ===================================================================== */}
        <div className="p-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <div>
            Showing {filteredEntries.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, filteredEntries.length)} of {filteredEntries.length} entries
          </div>

          <div className="flex items-center gap-1 font-semibold text-xs">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-[#4ba3b1] hover:bg-[#3b8e9c] disabled:opacity-40 text-white transition cursor-pointer"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-[#4ba3b1] hover:bg-[#3b8e9c] disabled:opacity-40 text-white transition cursor-pointer"
            >
              Prev
            </button>
            <button
              className="px-2.5 py-1 rounded bg-[#004d5a] text-white transition font-bold"
            >
              {currentPage}
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-[#4ba3b1] hover:bg-[#3b8e9c] disabled:opacity-40 text-white transition cursor-pointer"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-[#4ba3b1] hover:bg-[#3b8e9c] disabled:opacity-40 text-white transition cursor-pointer"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
