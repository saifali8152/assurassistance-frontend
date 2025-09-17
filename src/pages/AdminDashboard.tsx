// src/pages/AdminDashboard.tsx

import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
} from "lucide-react";

const AdminDashboard = () => {
  return (
    <>
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        {/* Total Sales Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-500/20"><DollarSign className="w-6 h-6 text-green-400" /></div>
            <span className="text-green-400 text-sm font-medium flex items-center"><TrendingUp className="w-4 h-4 mr-1" />12.4%</span>
          </div>
          <h3 className="text-white/60 text-sm font-medium mb-1">Total Sales</h3>
          <p className="text-white text-2xl font-bold">$248,900</p>
          <p className="text-white/40 text-xs mt-1">vs last 30 days</p>
        </div>

        {/* Gross Collected Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-500/20"><Activity className="w-6 h-6 text-blue-400" /></div>
            <span className="text-white/60 text-sm font-medium">-</span>
          </div>
          <h3 className="text-white/60 text-sm font-medium mb-1">Gross Collected</h3>
          <p className="text-white text-2xl font-bold">$198,320</p>
          <p className="text-white/40 text-xs mt-1">settlements received</p>
        </div>

        {/* Unpaid Balance Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-red-500/20"><TrendingDown className="w-6 h-6 text-red-400" /></div>
            <span className="text-red-400 text-sm font-medium flex items-center"><TrendingDown className="w-4 h-4 mr-1" />4.1%</span>
          </div>
          <h3 className="text-white/60 text-sm font-medium mb-1">Unpaid Balance</h3>
          <p className="text-white text-2xl font-bold">$34,780</p>
          <p className="text-white/40 text-xs mt-1">open invoices</p>
        </div>

        {/* Active Users Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-500/20"><Users className="w-6 h-6 text-green-400" /></div>
            <span className="text-green-400 text-sm font-medium flex items-center"><TrendingUp className="w-4 h-4 mr-1" />2.3%</span>
          </div>
          <h3 className="text-white/60 text-sm font-medium mb-1">Active Users</h3>
          <p className="text-white text-2xl font-bold">8,214</p>
          <p className="text-white/40 text-xs mt-1">last 7 days</p>
        </div>
      </div>

      {/* Charts Section & Users Table... (rest of the dashboard content) */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-lg font-semibold">Sales Trend (12 months)</h3>
            <span className="text-blue-400 text-sm px-3 py-1 rounded-full bg-blue-500/20">Line</span>
          </div>
          <div className="h-64 flex items-center justify-center bg-gradient-to-r from-blue-900/20 to-slate-800/20 rounded-xl">
            <p className="text-white/60">Chart visualization would go here</p>
          </div>
          <div className="flex justify-between text-white/60 text-sm mt-4">
            <span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span>
          </div>
        </div>
        {/* Product Mix Breakdown */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
          <h3 className="text-white text-lg font-semibold mb-6">Product Mix Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2"><span className="text-white/80">Basic</span><span className="text-white/60">28%</span></div>
              <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-gray-400 h-2 rounded-full" style={{ width: '28%' }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2"><span className="text-white/80">Standard</span><span className="text-white/60">34%</span></div>
              <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-blue-400 h-2 rounded-full" style={{ width: '34%' }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2"><span className="text-white/80">Premium</span><span className="text-white/60">22%</span></div>
              <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-green-400 h-2 rounded-full" style={{ width: '22%' }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2"><span className="text-white/80">Family</span><span className="text-white/60">16%</span></div>
              <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-cyan-400 h-2 rounded-full" style={{ width: '16%' }}></div></div>
            </div>
          </div>
        </div>
      </div>
      {/* Users Table */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
        <h3 className="text-white text-lg font-semibold mb-6">Recent Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="text-white/60 text-sm"><th className="text-left pb-4">User</th><th className="text-left pb-4">Sales</th><th className="text-left pb-4">Gross Collected</th><th className="text-left pb-4">Unpaid Balance</th><th className="text-left pb-4">Last Activity</th></tr>
            </thead>
            <tbody className="text-white text-left">
              <tr className="border-t border-white/10"><td className="py-4"><div className="flex items-center space-x-3"><img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" alt="Alex Morgan" className="w-8 h-8 rounded-full" /><span>Alex Morgan</span></div></td><td className="py-4">$24,890</td><td className="py-4">$21,440</td><td className="py-4 text-red-400">-$1,230</td><td className="py-4 text-white/60">2h ago</td></tr>
              <tr className="border-t border-white/10"><td className="py-4"><div className="flex items-center space-x-3"><img src="https://images.unsplash.com/photo-1494790108755-2616b612b043?w=32&h=32&fit=crop&crop=face" alt="Priya Shah" className="w-8 h-8 rounded-full" /><span>Priya Shah</span></div></td><td className="py-4">$18,220</td><td className="py-4">$16,010</td><td className="py-4 text-red-400">-$980</td><td className="py-4 text-white/60">5h ago</td></tr>
              <tr className="border-t border-white/10"><td className="py-4"><div className="flex items-center space-x-3"><img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=32&h=32&fit=crop&crop=face" alt="Diego Ramos" className="w-8 h-8 rounded-full" /><span>Diego Ramos</span></div></td><td className="py-4">$15,730</td><td className="py-4">$13,450</td><td className="py-4 text-red-400">-$620</td><td className="py-4 text-white/60">1d ago</td></tr>
              <tr className="border-t border-white/10"><td className="py-4"><div className="flex items-center space-x-3"><img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32&fit=crop&crop=face" alt="Mai Nguyen" className="w-8 h-8 rounded-full" /><span>Mai Nguyen</span></div></td><td className="py-4">$12,310</td><td className="py-4">$10,980</td><td className="py-4 text-red-400">-$410</td><td className="py-4 text-white/60">2d ago</td></tr>
              <tr className="border-t border-white/10"><td className="py-4"><div className="flex items-center space-x-3"><img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" alt="Owen Lee" className="w-8 h-8 rounded-full" /><span>Owen Lee</span></div></td><td className="py-4">$9,840</td><td className="py-4">$8,300</td><td className="py-4 text-red-400">-$290</td><td className="py-4 text-white/60">3d ago</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;