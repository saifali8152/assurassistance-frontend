import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Download, Calendar, Search, Filter } from 'lucide-react';
import { getReconciliationApi } from '../api/reconciliationApi';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext';

// Match backend fields exactly!
interface ReconciliationData {
  user_id: number;
  agent_name: string;
  month: string;
  total_sales: number;
  total_amount: number;
  paid_amount: number;
  unpaid_amount: number;
  partial_amount: number;
  balance_due: number;
  gross_collected: number;
  fees: number;
  net_due: number;
}

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const years = ['2023', '2024', '2025', '2026'];

function Reconciliation() {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  
  // Get current month and year
  const currentDate = new Date();
  const currentMonth = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear().toString();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [data, setData] = useState<ReconciliationData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getReconciliationApi(selectedMonth, selectedYear)
      .then((res: any) => {
        setData(res.data || []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [selectedMonth, selectedYear]);

  // Only filter by agent name (backend already filters by month/year)
  const filteredData = useMemo(() => {
    return data.filter(item =>
      item.agent_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, data]);


  const exportToCSV = () => {
    const csvEscape = (val: unknown): string => {
      if (val == null) return "";
      const s = typeof val === "number" && Number.isFinite(val) ? String(val) : String(val);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const headers = [
      "Agent Name",
      "Month",
      "Total Sales",
      "Total Amount",
      "Paid Amount",
      "Unpaid Amount",
      "Partial Amount",
      "Balance Due",
      "Gross Collected",
      "Fees",
      "Net Due"
    ];
    const lines = [
      headers.map(csvEscape).join(","),
      ...filteredData.map((row) =>
        [
          row.agent_name,
          row.month,
          row.total_sales ?? "",
          row.total_amount ?? "",
          row.paid_amount ?? "",
          row.unpaid_amount ?? "",
          row.partial_amount ?? "",
          row.balance_due ?? "",
          row.gross_collected ?? "",
          row.fees ?? "",
          row.net_due ?? ""
        ]
          .map(csvEscape)
          .join(",")
      )
    ];

    const csvContent = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reconciliation-${selectedMonth}-${selectedYear}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isMonthDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right - 256 // 256px is the width of the dropdown (w-64)
      });
    }
  }, [isMonthDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        const dropdown = document.getElementById('month-dropdown');
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setIsMonthDropdownOpen(false);
        }
      }
    };

    if (isMonthDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMonthDropdownOpen]);

  return (
    <>
      <div className="w-full space-y-6">

        {/* Header & Controls Card */}
        <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

            {/* Left Side - Title */}
            <div>
              <h1 className="text-[#E4590F] font-semibold text-2xl sm:text-3xl lg:text-4xl mb-2">
                {t('reconciliation.title')}
              </h1>
              <p className="text-[#2B2B2B]/70 text-sm sm:text-base font-normal">
                {t('reconciliation.subtitle')}
              </p>
            </div>

            {/* Right Side - All Controls in a Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2B2B2B]/50" size={18} />
                <input
                  type="text"
                  placeholder={t('reconciliation.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] placeholder-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:ring-[#E4590F] transition-all duration-200 font-normal"
                />
              </div>

              {/* Month Selector */}
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                  className="flex items-center gap-2 bg-white hover:bg-[#D9D9D9]/30 border border-[#D9D9D9] rounded-xl px-4 py-2.5 text-[#2B2B2B] font-medium transition-all duration-200 min-w-[140px] whitespace-nowrap"
                >
                  <Calendar size={18} className="text-[#E4590F]" />
                  {selectedMonth} {selectedYear}
                  <ChevronDown size={16} className={`transform transition-transform text-[#E4590F] ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Export Button */}
              <button
                onClick={exportToCSV}
                className="flex items-center justify-center gap-2 bg-[#E4590F] hover:bg-[#C94A0D] text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap"
              >
                <Download size={18} />
                {t('reconciliation.export')}
              </button>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
          <div className="overflow-x-auto relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex items-center gap-3 text-[#2B2B2B]">
                  <div className="w-6 h-6 border-2 border-[#D9D9D9] border-t-[#E4590F] rounded-full animate-spin"></div>
                  <span className="font-normal">{t('reconciliation.loading', 'Loading reconciliation data...')}</span>
                </div>
              </div>
            )}
            
            {filteredData.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D9D9D9]">
                    <th className="py-4 px-2 text-[#2B2B2B]/70 font-normal text-sm">{t('reconciliation.agentName')}</th>
                    <th className="py-4 px-2 text-[#2B2B2B]/70 font-normal text-sm">{t('reconciliation.totalSales')}</th>
                    <th className="py-4 px-2 text-[#2B2B2B]/70 font-normal text-sm">{t('reconciliation.totalAmount')}</th>
                    <th className="py-4 px-2 text-[#2B2B2B]/70 font-normal text-sm">{t('reconciliation.paidAmount')}</th>
                    <th className="py-4 px-2 text-[#2B2B2B]/70 font-normal text-sm">{t('reconciliation.unpaidAmount')}</th>
                    <th className="py-4 px-2 text-[#2B2B2B]/70 font-normal text-sm">{t('reconciliation.balanceDue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, index) => (
                    <tr key={row.user_id} className={`border-b border-[#D9D9D9] hover:bg-[#D9D9D9]/30 transition-colors ${index % 2 === 0 ? 'bg-[#D9D9D9]/10' : ''}`}>
                      <td className="py-4 px-2">
                        <div className="text-[#2B2B2B] font-semibold">{row.agent_name}</div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className="text-[#2B2B2B] font-semibold bg-[#E4590F]/10 border border-[#E4590F]/20 px-2 py-1 rounded-lg">
                          {row.total_sales}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-[#2B2B2B] font-semibold">
                          {formatCurrency(row.total_amount)}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="font-semibold text-[#2B2B2B]">
                          {formatCurrency(row.paid_amount)}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-[#2B2B2B] font-semibold">
                          {formatCurrency(row.unpaid_amount)}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-[#2B2B2B]">
                        <span className="font-semibold">
                          {formatCurrency(row.balance_due)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : !loading ? (
              <div className="text-center py-12">
                <Filter className="mx-auto mb-4 text-[#2B2B2B]/40" size={48} />
                <h3 className="text-[#2B2B2B] text-lg font-semibold mb-2">{t('reconciliation.noData')}</h3>
                <p className="text-[#2B2B2B]/60 font-normal">
                  {t('reconciliation.noDataFor', { month: selectedMonth, year: selectedYear })}
                </p>
              </div>
            ) : null}
          </div>
        </div>

      </div>

      {isMonthDropdownOpen && (
        <div
          id="month-dropdown"
          className="fixed bg-white border border-[#D9D9D9] rounded-xl shadow-lg w-64 animate-fadeIn"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999
          }}
        >
          <div className="p-4">
            <div className="text-[#2B2B2B]/70 text-xs font-normal mb-3 text-center">{t('reconciliation.year')}</div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${selectedYear === year
                      ? 'bg-[#E4590F] text-white'
                      : 'text-[#2B2B2B] hover:bg-[#D9D9D9]/50 bg-[#D9D9D9]/30'
                    }`}
                >
                  {year}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-1">
              {months.map(month => (
                <button
                  key={month}
                  onClick={() => {
                    setSelectedMonth(month);
                    setIsMonthDropdownOpen(false);
                  }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${selectedMonth === month
                      ? 'bg-[#E4590F] text-white'
                      : 'text-[#2B2B2B] hover:bg-[#D9D9D9]/50 bg-[#D9D9D9]/30'
                    }`}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default Reconciliation;