import { useEffect, useState } from "react";
import { getAdminDashboardApi } from "../api/adminApi";
import { Users, TrendingDown, DollarSign, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

const AdminDashboard = () => {
  const defaultStats = {
    totalSales: 0,
    grossCollected: 0,
    unpaidBalance: 0,
    activeUsers: 0,
    recentUsers: []
  };
  const [stats, setStats] = useState<any>(defaultStats);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });

  useEffect(() => {
    getAdminDashboardApi()
      .then((data) => {
        setStats({ ...defaultStats, ...data }); // data is now the stats object
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching dashboard stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-white">Loading...</p>;

  return (
    <>
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        {/* Total Sales */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-500/20">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <h3 className="text-white/60 text-sm font-medium mb-1"> {t("totalSales")}</h3>
          <p className="text-white text-2xl font-bold">${stats.totalSales}</p>
        </div>
        {/* Gross Collected */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-500/20"><Activity className="w-6 h-6 text-blue-400" /></div>
          </div>
          <h3 className="text-white/60 text-sm font-medium mb-1">{t("grossCollected")}</h3>
          <p className="text-white text-2xl font-bold">${stats.grossCollected}</p>
        </div>

        {/* Unpaid Balance */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-red-500/20"><TrendingDown className="w-6 h-6 text-red-400" /></div>
          </div>
          <h3 className="text-white/60 text-sm font-medium mb-1">{t("unpaidBalance")}</h3>
          <p className="text-white text-2xl font-bold">${stats.unpaidBalance}</p>
        </div>

        {/* Active Users */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-500/20"><Users className="w-6 h-6 text-green-400" /></div>
          </div>
          <h3 className="text-white/60 text-sm font-medium mb-1">{t("activeUsers")}</h3>
          <p className="text-white text-2xl font-bold">{stats.activeUsers}</p>
        </div>
      </div>

      {/* Charts Section & Users Table... (rest of the dashboard content) 
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
        {/* Sales Trend Chart 
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
        </div>   */}
      {/* Product Mix Breakdown 
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
        </div>   */}


      {/* Recent Users Table */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
        <h3 className="text-white text-lg font-semibold mb-6">{t("recentUsers")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="text-white/60 text-sm">
                <th className="text-left pb-4">{t("user")}</th>
                <th className="text-left pb-4">{t("sales")}</th>
                <th className="text-left pb-4">{t("grossCollected")}</th>
                <th className="text-left pb-4">{t("unpaidBalance")}</th>
                <th className="text-left pb-4">{t("lastActivity")}</th>
              </tr>
            </thead>
            <tbody className="text-white text-left">
              {stats.recentUsers.map((u: any) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="py-4">{u.name}</td>
                  <td className="py-4">${u.total_sales}</td>
                  <td className="py-4">${u.gross_collected}</td>
                  <td className="py-4 text-red-400">-${u.unpaid_balance}</td>
                  <td className="py-4 text-white/60">{u.last_activity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
export default AdminDashboard;