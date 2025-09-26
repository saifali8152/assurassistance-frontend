import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Download, Calendar, Search, Filter } from 'lucide-react';

interface ReconciliationData {
  id: string;
  agentName: string;
  month: string;
  totalSales: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  partialAmount: number;
  balanceDue: number;
  user: string;
  grossCollected: number;
  fees: number;
  netDue: number;
  notes: string;
}

// Sample data - in a real app, this would come from an API
const sampleData: ReconciliationData[] = [
  {
    id: '1',
    agentName: 'John Smith',
    month: 'Sep-2025',
    totalSales: 15,
    totalAmount: 2500.0,
    paidAmount: 2000.0,
    unpaidAmount: 300.0,
    partialAmount: 200.0,
    balanceDue: 500.0,
    user: 'John Smith',
    grossCollected: 15420.50,
    fees: 1542.05,
    netDue: 13878.45,
    notes: 'Regular commission'
  },
  {
    id: '2',
    agentName: 'Sarah Johnson',
    month: 'Sep-2025',
    totalSales: 22,
    totalAmount: 3200.5,
    paidAmount: 2800.0,
    unpaidAmount: 200.5,
    partialAmount: 200.0,
    balanceDue: 400.5,
    user: 'Sarah Johnson',
    grossCollected: 22150.75,
    fees: 2215.08,
    netDue: 19935.67,
    notes: 'Bonus applied'
  },
  {
    id: '3',
    agentName: 'Mike Davis',
    month: 'Apr-2025',
    totalSales: 8,
    totalAmount: 1500.75,
    paidAmount: 1200.0,
    unpaidAmount: 150.75,
    partialAmount: 150.0,
    balanceDue: 300.75,
    user: 'Mike Davis',
    grossCollected: 8930.25,
    fees: 893.03,
    netDue: 8037.22,
    notes: ''
  },
  {
    id: '4',
    agentName: 'Emily Chen',
    month: 'Sep-2025',
    totalSales: 31,
    totalAmount: 4500.0,
    paidAmount: 3800.0,
    unpaidAmount: 400.0,
    partialAmount: 300.0,
    balanceDue: 700.0,
    user: 'Emily Chen',
    grossCollected: 31250.00,
    fees: 3125.00,
    netDue: 28125.00,
    notes: 'Top performer'
  },
  {
    id: '5',
    agentName: 'Robert Wilson',
    month: 'Sep-2025',
    totalSales: 12,
    totalAmount: 2000.9,
    paidAmount: 1500.0,
    unpaidAmount: 250.9,
    partialAmount: 250.0,
    balanceDue: 500.9,
    user: 'Robert Wilson',
    grossCollected: 12780.90,
    fees: 1278.09,
    netDue: 11502.81,
    notes: 'Partial month'
  },
  {
    id: '6',
    agentName: '',
    month: 'Aug-2025',
    totalSales: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    partialAmount: 0,
    balanceDue: 0,
    user: 'Lisa Anderson',
    grossCollected: 18640.30,
    fees: 1864.03,
    netDue: 16776.27,
    notes: 'Regular commission'
  },
  {
    id: '7',
    agentName: '',
    month: 'Aug-2025',
    totalSales: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    partialAmount: 0,
    balanceDue: 0,
    user: 'David Brown',
    grossCollected: 25890.60,
    fees: 2589.06,
    netDue: 23301.54,
    notes: 'Exceeded target'
  },
  {
    id: '8',
    agentName: '',
    month: 'Jan-2024',
    totalSales: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    partialAmount: 0,
    balanceDue: 0,
    user: 'Sophia Miller',
    grossCollected: 17890.40,
    fees: 1789.04,
    netDue: 16101.36,
    notes: 'On track'
  },
  {
    id: '9',
    agentName: '',
    month: 'Mar-2023',
    totalSales: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    partialAmount: 0,
    balanceDue: 0,
    user: 'Liam Johnson',
    grossCollected: 30250.75,
    fees: 3025.07,
    netDue: 27225.68,
    notes: 'Highest quarter so far'
  },
  {
    id: '10',
    agentName: '',
    month: 'Jul-2022',
    totalSales: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    partialAmount: 0,
    balanceDue: 0,
    user: 'Olivia Davis',
    grossCollected: 14980.30,
    fees: 1498.03,
    netDue: 13482.27,
    notes: 'Steady performance'
  },
  {
    id: '11',
    agentName: '',
    month: 'Oct-2021',
    totalSales: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    partialAmount: 0,
    balanceDue: 0,
    user: 'Ethan Wilson',
    grossCollected: 22560.90,
    fees: 2256.09,
    netDue: 20304.81,
    notes: 'Improved compared to last year'
  },
  {
    id: '12',
    agentName: '',
    month: 'Dec-2020',
    totalSales: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    partialAmount: 0,
    balanceDue: 0,
    user: 'Ava Martinez',
    grossCollected: 31240.50,
    fees: 3124.05,
    netDue: 28116.45,
    notes: 'Year-end spike'
  },
  {
    id: '13',
    agentName: '',
    month: 'Feb-2023',
    totalSales: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    partialAmount: 0,
    balanceDue: 0,
    user: 'Noah Anderson',
    grossCollected: 19875.20,
    fees: 1987.52,
    netDue: 17887.68,
    notes: 'Slight dip this month'
  },
  {
    id: '14',
    agentName: '',
    month: 'May-2024',
    totalSales: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    partialAmount: 0,
    balanceDue: 0,
    user: 'Isabella Thomas',
    grossCollected: 26740.10,
    fees: 2674.01,
    netDue: 24066.09,
    notes: 'Exceeded quarterly goal'
  },
  {
    id: '15',
    agentName: '',
    month: 'Nov-2022',
    totalSales: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    partialAmount: 0,
    balanceDue: 0,
    user: 'James Garcia',
    grossCollected: 18590.00,
    fees: 1859.00,
    netDue: 16731.00,
    notes: 'Consistent growth'
  },
  {
    id: '16',
    agentName: '',
    month: 'Apr-2021',
    totalSales: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    partialAmount: 0,
    balanceDue: 0,
    user: 'Mia Rodriguez',
    grossCollected: 20950.85,
    fees: 2095.09,
    netDue: 18855.76,
    notes: 'Solid mid-year performance'
  },
  {
    id: '17',
    agentName: '',
    month: 'Sep-2020',
    totalSales: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    partialAmount: 0,
    balanceDue: 0,
    user: 'Benjamin Lee',
    grossCollected: 27480.70,
    fees: 2748.07,
    netDue: 24732.63,
    notes: 'Recovered after slump'
  }
];

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const years = ['2023', '2024', '2025', '2026'];

function Reconciliation() {
  const [selectedMonth, setSelectedMonth] = useState('Sep');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Filter data based on selected month/year and search term
  const filteredData = useMemo(() => {
    const monthYear = `${selectedMonth}-${selectedYear}`;
    return sampleData.filter(item =>
      item.month === monthYear &&
      (
        item.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [selectedMonth, selectedYear, searchTerm]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce((acc, item) => ({
      grossCollected: acc.grossCollected + item.grossCollected,
      fees: acc.fees + item.fees,
      netDue: acc.netDue + item.netDue
    }), { grossCollected: 0, fees: 0, netDue: 0 });
  }, [filteredData]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const exportToCSV = () => {
    const headers = [
      'Agent Name', 'User', 'Month', 'Total Sales', 'Total Amount', 'Paid Amount', 'Unpaid Amount', 'Partial Amount', 'Balance Due',
      'Gross Collected', 'Fees', 'Net Due', 'Notes'
    ];
    const csvData = [
      headers,
      ...filteredData.map(row => [
        row.agentName,
        row.user,
        row.month,
        row.totalSales.toString(),
        row.totalAmount.toString(),
        row.paidAmount.toString(),
        row.unpaidAmount.toString(),
        row.partialAmount.toString(),
        row.balanceDue.toString(),
        row.grossCollected.toString(),
        row.fees.toString(),
        row.netDue.toString(),
        row.notes
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reconciliation-${selectedMonth}-${selectedYear}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="w-full space-y-6">

        {/* Header & Controls Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

            {/* Left Side - Title */}
            <div>
              <h1 className="text-white font-bold text-2xl sm:text-3xl lg:text-4xl mb-2">
                Reconciliation Table
              </h1>
              <p className="text-white/70 text-sm sm:text-base">
                Monthly reconciliation summary for all agents
              </p>
            </div>

            {/* Right Side - All Controls in a Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={18} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Month Selector */}
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2.5 text-white font-medium transition-all duration-200 min-w-[140px] whitespace-nowrap"
                >
                  <Calendar size={18} />
                  {selectedMonth} {selectedYear}
                  <ChevronDown size={16} className={`transform transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Export Button */}
              <button
                onClick={exportToCSV}
                className="flex items-center justify-center gap-2 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg transform hover:scale-105 whitespace-nowrap"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl ">
          <div className="overflow-x-auto">
            {filteredData.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="py-4 px-2 text-white/80 font-semibold text-sm ">Agent Name</th>
                    <th className="py-4 px-2 text-white/80 font-semibold text-sm ">Total Sales</th>
                    <th className="py-4 px-2 text-white/80 font-semibold text-sm ">Total Amount</th>
                    <th className="py-4 px-2 text-white/80 font-semibold text-sm ">Paid Amount</th>
                    <th className="py-4 px-2 text-white/80 font-semibold text-sm ">Unpaid Amount</th>
                    <th className="py-4 px-2 text-white/80 font-semibold text-sm ">Partial Amount</th>
                    <th className="py-4 px-2 text-white/80 font-semibold text-sm ">Balance Due</th>
                    <th className="py-4 px-2 text-white/80 font-semibold text-sm">User</th>
                    <th className="py-4 px-2 text-white/80 font-semibold text-sm">Month</th>
                    <th className="py-4 px-2 text-white/80 font-semibold text-sm">Gross Collected</th>
                    <th className="py-4 px-2 text-white/80 font-semibold text-sm">Fees</th>
                    <th className="py-4 px-2 text-white/80 font-semibold text-sm">Net Due</th>
                    <th className="py-4 px-2 text-white/80 font-semibold text-sm">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, index) => (
                    <tr key={row.id} className={`border-b border-white/10 hover:bg-white/5 transition-colors ${index % 2 === 0 ? 'bg-white/2' : ''}`}>
                      <td className="py-4 px-2">
                        <div className="text-white font-medium">{row.agentName}</div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className="text-white font-semibold bg-blue-500/20 px-2 py-1 rounded-lg">
                          {row.totalSales}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-white font-semibold">
                          {formatCurrency(row.totalAmount)}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="font-semibold text-white">
                          {formatCurrency(row.paidAmount)}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-white font-semibold">
                          {formatCurrency(row.unpaidAmount)}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-white font-semibold">
                          {formatCurrency(row.partialAmount)}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-white">
                        <span className="font-semibold">
                          {formatCurrency(row.balanceDue)}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <div className="text-white font-medium">{row.user}</div>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-white/80 text-sm bg-white/10 px-2 py-1 rounded-lg">
                          {row.month}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-white font-semibold">
                          {formatCurrency(row.grossCollected)}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-white font-semibold">
                          {formatCurrency(row.fees)}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-white font-semibold">
                          {formatCurrency(row.netDue)}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-white/70 text-sm">
                          {row.notes || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <Filter className="mx-auto mb-4 text-white/50" size={48} />
                <h3 className="text-white/80 text-lg font-medium mb-2">No data found</h3>
                <p className="text-white/50">No reconciliation data available for {selectedMonth} {selectedYear}</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Portal-style dropdown rendered outside main container */}
      {isMonthDropdownOpen && (
        <div
          id="month-dropdown"
          className="fixed bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl w-64"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999
          }}
        >
          <div className="p-4">
            <div className="text-white/70 text-xs font-semibold mb-3 text-center">YEAR</div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedYear === year
                      ? 'bg-white/30 text-white'
                      : 'text-white/80 hover:bg-white/10'
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
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedMonth === month
                      ? 'bg-white/30 text-white'
                      : 'text-white/80 hover:bg-white/10'
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