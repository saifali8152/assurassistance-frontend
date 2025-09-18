import React from 'react';
import { BarChart3, FileText, Monitor, PieChart } from 'lucide-react';

const UserDashboard = () => {
  const recentSales = [
    {
      policyNumber: 'TS-10421',
      customerName: 'Emily Carter',
      destination: 'Paris',
      travelDates: 'Apr 12 – Apr 20',
      premium: '$320',
      status: 'paid'
    },
    {
      policyNumber: 'TS-10420',
      customerName: 'David Lee',
      destination: 'London',
      travelDates: 'Apr 08 – Apr 15',
      premium: '$280',
      status: 'unpaid'
    },
    {
      policyNumber: 'TS-10419',
      customerName: 'Noah Patel',
      destination: 'Tokyo',
      travelDates: 'Apr 02 – Apr 10',
      premium: '$410',
      status: 'paid'
    },
    {
      policyNumber: 'TS-10418',
      customerName: 'Sophia Nguyen',
      destination: 'Rome',
      travelDates: 'Mar 26 – Apr 03',
      premium: '$360',
      status: 'paid'
    }
  ];

  const salesTrendsData = [
    { month: 'Nov', value: 8 },
    { month: 'Dec', value: 12 },
    { month: 'Jan', value: 9 },
    { month: 'Feb', value: 14 },
    { month: 'Mar', value: 13 },
    { month: 'Apr', value: 16 },
    { month: 'May', value: 18 }
  ];

  const maxValue = Math.max(...salesTrendsData.map(d => d.value));

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header Section */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl w-full">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 relative group hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/80 text-sm font-medium">Sales Today</h3>
              <Monitor className="w-5 h-5 text-white/60" />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-white">$2,500</p>
              <p className="text-green-400 text-sm">vs yesterday: +8%</p>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 relative group hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/80 text-sm font-medium">Total Sales</h3>
              <BarChart3 className="w-5 h-5 text-white/60" />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-white">$15,000</p>
              <p className="text-white/60 text-sm">MTD</p>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 relative group hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/80 text-sm font-medium">Paid % / Unpaid %</h3>
              <PieChart className="w-5 h-5 text-white/60" />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-white">85% / 15%</p>
              <p className="text-white/60 text-sm">Collection rate</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 md:gap-4">
          <button className="cursor-pointer px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors duration-200 flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Create Case</span>
          </button>
          <button className="cursor-pointer px-6 py-3 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-xl font-medium transition-colors duration-200">
            View Ledger
          </button>
          <button className="cursor-pointer px-6 py-3 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-xl font-medium transition-colors duration-200">
            Generate Report
          </button>
        </div>
        
      </div>

      {/* Recent Sales Table */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl w-full">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Recent Sales</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-center py-4 px-2 text-white/80 font-medium text-sm">Policy Number</th>
                <th className="text-center py-4 px-2 text-white/80 font-medium text-sm">Customer Name</th>
                <th className="text-center py-4 px-2 text-white/80 font-medium text-sm hidden sm:table-cell">Destination</th>
                <th className="text-center py-4 px-2 text-white/80 font-medium text-sm hidden md:table-cell">Travel Dates</th>
                <th className="text-center py-4 px-2 text-white/80 font-medium text-sm">Premium</th>
                <th className="text-center py-4 px-2 text-white/80 font-medium text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale, index) => (
                <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200">
                  <td className="py-4 px-2 text-white/90 font-medium text-sm">{sale.policyNumber}</td>
                  <td className="py-4 px-2 text-white text-sm">{sale.customerName}</td>
                  <td className="py-4 px-2 text-white text-sm hidden sm:table-cell">{sale.destination}</td>
                  <td className="py-4 px-2 text-white/80 text-sm hidden md:table-cell">{sale.travelDates}</td>
                  <td className="py-4 px-2 text-white font-semibold text-sm">{sale.premium}</td>
                  <td className="py-4 px-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      sale.status === 'paid' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {sale.status === 'paid' ? '✓ Paid' : '⏳ Unpaid'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Status Breakdown */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Status Breakdown</h2>
          
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                {/* Background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="20"
                />
                {/* Paid percentage (85%) */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="20"
                  strokeDasharray={`${85 * 5.024} ${15 * 5.024}`}
                  strokeLinecap="round"
                />
                {/* Unpaid percentage (15%) */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="20"
                  strokeDasharray={`${15 * 5.024} ${85 * 5.024}`}
                  strokeDashoffset={`-${85 * 5.024}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">85%</p>
                  <p className="text-sm text-white/80">Paid</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-white/80 text-sm">Paid</span>
              </div>
              <span className="text-white font-medium">85%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-white/80 text-sm">Unpaid</span>
              </div>
              <span className="text-white font-medium">15%</span>
            </div>
          </div>
        </div>

        {/* Sales Trends */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Sales Trends</h2>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-white/80 text-sm">Sales</span>
            </div>
          </div>
          <p className="text-white/60 text-sm mb-6">Last 6 Months</p>

          <div className="relative h-48">
            <div className="absolute inset-0 flex items-end justify-between space-x-4">
              {salesTrendsData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full relative mb-3">
                    <div 
                      className="w-full bg-blue-500 rounded-t-lg transition-all duration-300 hover:bg-blue-400"
                      style={{ 
                        height: `${(data.value / maxValue) * 140}px`,
                        minHeight: '8px'
                      }}
                    ></div>
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <span className="text-white/80 text-xs">${data.value}k</span>
                    </div>
                  </div>
                  <span className="text-white/60 text-xs">{data.month}</span>
                </div>
              ))}
            </div>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-white/40 text-xs -ml-8">
              <span>$20k</span>
              <span>$16k</span>
              <span>$12k</span>
              <span>$8k</span>
              <span>$4k</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;