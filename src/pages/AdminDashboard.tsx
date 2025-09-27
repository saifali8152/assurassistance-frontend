import { useEffect, useState } from "react";
import { getAdminDashboardApi } from "../api/adminApi";
import { Users, TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { useTranslation } from "react-i18next"; // <-- Add this

const AdminDashboard = () => {
  const { t } = useTranslation(); // <-- Add this

  const defaultStats = {
    totalSales: 0,
    grossCollected: 0,
    unpaidBalance: 0,
    activeUsers: 0,
    recentUsers: []
  };

  const [stats, setStats] = useState<any>(defaultStats);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p className="text-white">{t("adminDashboard.loading", "Loading...")}</p>;

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
          <h3 className="text-white/60 text-sm font-medium mb-1">{t("adminDashboard.totalSales", "Total Sales")}</h3>
          <p className="text-white text-2xl font-bold">${stats.totalSales}</p>
        </div>

        {/* Gross Collected */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-500/20"><Activity className="w-6 h-6 text-blue-400" /></div>
          </div>
          <h3 className="text-white/60 text-sm font-medium mb-1">{t("adminDashboard.grossCollected", "Gross Collected")}</h3>
          <p className="text-white text-2xl font-bold">${stats.grossCollected}</p>
        </div>

        {/* Unpaid Balance */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-red-500/20"><TrendingDown className="w-6 h-6 text-red-400" /></div>
          </div>
          <h3 className="text-white/60 text-sm font-medium mb-1">{t("adminDashboard.unpaidBalance", "Unpaid Balance")}</h3>
          <p className="text-white text-2xl font-bold">${stats.unpaidBalance}</p>
        </div>

        {/* Active Users */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-500/20"><Users className="w-6 h-6 text-green-400" /></div>
          </div>
          <h3 className="text-white/60 text-sm font-medium mb-1">{t("adminDashboard.activeUsers", "Active Users")}</h3>
          <p className="text-white text-2xl font-bold">{stats.activeUsers}</p>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
        <h3 className="text-white text-lg font-semibold mb-6">{t("adminDashboard.recentUsers", "Recent Users")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="text-white/60 text-sm">
                <th className="text-left pb-4">{t("adminDashboard.user", "User")}</th>
                <th className="text-left pb-4">{t("adminDashboard.sales", "Sales")}</th>
                <th className="text-left pb-4">{t("adminDashboard.grossCollected", "Gross Collected")}</th>
                <th className="text-left pb-4">{t("adminDashboard.unpaidBalance", "Unpaid Balance")}</th>
                <th className="text-left pb-4">{t("adminDashboard.lastActivity", "Last Activity")}</th>
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