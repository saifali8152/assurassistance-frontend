import { useEffect, useState } from "react";
import { getAdminDashboardApi, getProductionTrendApi } from "../api/adminApi";
import {
  Users,
  TrendingDown,
  DollarSign,
  Activity,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../context/CurrencyContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AdminDashboard = () => {
  const defaultStats = {
    totalSales: 0,
    grossCollected: 0,
    unpaidBalance: 0,
    activeUsers: 0,
    recentSales: [],
  };

  const [stats, setStats] = useState<any>(defaultStats);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation(undefined, { keyPrefix: "adminDashboard" });
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    Promise.all([
      getAdminDashboardApi(),
      getProductionTrendApi(),
    ])
      .then(([dashboardData, trendData]) => {
        setStats({ ...defaultStats, ...dashboardData });
        setTrendData(trendData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching dashboard stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <p className="text-text-secondary">{t("adminDashboard.loading", "Loading...")}</p>
    );

  return (
    <>
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        {/* Total Sales */}
        <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-500/20">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <h3 className="text-text-secondary/70 text-sm font-normal mb-1">
            {" "}
            {t("totalSales")}
          </h3>
          <p className="text-primary text-2xl font-semibold">{stats.totalSales}</p>
        </div>
        {/* Gross Collected */}
        <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 transition-colors hover:bg-secondary/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <Activity className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h3 className="text-text-secondary/70 text-sm font-normal mb-1">
            {t("grossCollected")}
          </h3>
          <p className="text-primary text-2xl font-semibold">
            {formatCurrency(stats.grossCollected)}
          </p>
        </div>

        {/* Unpaid Balance */}
        <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 transition-colors hover:bg-secondary/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-red-500/20">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <h3 className="text-text-secondary/70 text-sm font-normal mb-1">
            {t("unpaidBalance")}
          </h3>
          <p className="text-red-600 text-2xl font-semibold">
            {formatCurrency(stats.unpaidBalance)}
          </p>
        </div>

        {/* Active Users */}
        <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 transition-colors hover:bg-secondary/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Users className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <h3 className="text-text-secondary/70 text-sm font-normal mb-1">
            {t("activeUsers")}
          </h3>
          <p className="text-primary text-2xl font-semibold">{stats.activeUsers}</p>
        </div>
      </div>

      {/* Production Trend Graph */}
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-primary text-xl font-semibold">
            {t("productionTrend", "Production Trend")}
          </h3>
          <div className="p-2 rounded-lg bg-primary/20">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
        </div>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9D9D9" />
              <XAxis 
                dataKey="monthLabel" 
                stroke="#2B2B2B"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#2B2B2B"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                stroke="#2B2B2B"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #D9D9D9',
                  borderRadius: '8px',
                  padding: '10px'
                }}
                formatter={(value: any, name: string | undefined) => {
                  if (name === 'salesCount') {
                    return [value, t("salesCount", "Sales Count")];
                  } else if (name === 'totalAmount') {
                    return [formatCurrency(value), t("totalAmount", "Total Amount")];
                  } else if (name === 'collectedAmount') {
                    return [formatCurrency(value), t("collectedAmount", "Collected Amount")];
                  }
                  return [value, name || ''];
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value: string) => {
                  if (value === 'salesCount') return t("salesCount", "Sales Count");
                  if (value === 'totalAmount') return t("totalAmount", "Total Amount");
                  if (value === 'collectedAmount') return t("collectedAmount", "Collected Amount");
                  return value;
                }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="salesCount" 
                stroke="#E4590F" 
                strokeWidth={2}
                name="salesCount"
                dot={{ fill: '#E4590F', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="totalAmount" 
                stroke="#10B981" 
                strokeWidth={2}
                name="totalAmount"
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="collectedAmount" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="collectedAmount"
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-text-secondary/60">
            {t("noTrendData", "No trend data available")}
          </div>
        )}
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6">
        <h3 className="text-primary text-xl font-semibold mb-6">
          {t("recentSales", "Recent Sales")}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D9D9D9]">
                <th className="text-left text-text-secondary/70 font-normal py-4 px-2">
                  {t("saleId", "Sale ID")}
                </th>
                <th className="text-center text-text-secondary/70 font-normal py-4 px-2">
                  {t("traveller", "Traveller")}
                </th>
                <th className="text-center text-text-secondary/70 font-normal py-4 px-2">
                  {t("plan", "Plan")}
                </th>
                <th className="text-center text-text-secondary/70 font-normal py-4 px-2">
                  {t("total", "Total")}
                </th>
                <th className="text-center text-text-secondary/70 font-normal py-4 px-2">
                  {t("paymentStatus", "Payment Status")}
                </th>
                <th className="text-center text-text-secondary/70 font-normal py-4 px-2">
                  {t("createdBy", "Created By")}
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSales.map((sale: any) => (
                <tr key={sale.sale_id} className="border-b border-[#D9D9D9] hover:bg-secondary/30 transition-colors">
                  <td className="py-4 px-2">
                    <div className="text-text-secondary font-normal">
                      Sale #{sale.sale_id}
                    </div>
                    <div className="text-text-secondary/60 text-sm">
                      Case #{sale.case_id}
                    </div>
                  </td>
                  <td className="py-4 px-2 text-text-secondary/80">
                    <div className="text-center">
                      <div className="text-text-secondary font-normal">
                        {sale.traveller_name}
                      </div>
                      <div className="text-text-secondary/60 text-sm">
                        {sale.traveller_phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-text-secondary/80">
                    <div className="text-center">
                      <div className="text-text-secondary font-normal">
                        {sale.plan_name}
                      </div>
                      <div className="text-text-secondary/60 text-sm">
                        {sale.product_type}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-text-secondary/80">
                    <div className="text-center">
                      <div className="text-text-secondary font-semibold">
                        {formatCurrency(sale.total)}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex justify-center">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          sale.payment_status === "Paid"
                            ? "bg-green-500/20 text-green-600"
                            : "bg-red-500/20 text-red-600"
                        }`}
                      >
                        {sale.payment_status}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-text-secondary/80">
                    <div className="text-center">
                      <div className="text-text-secondary font-normal">
                        {sale.created_by_name || "Unknown"}
                      </div>
                    </div>
                  </td>
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
