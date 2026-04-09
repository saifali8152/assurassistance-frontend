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
import type { TFunction } from "i18next";
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

export type TrendPoint = {
  periodLabel: string;
  salesCount: number;
  totalAmount: number;
  collectedAmount: number;
};

function ProductionTrendChart({
  title,
  data,
  formatCurrency,
  t,
}: {
  title: string;
  data: TrendPoint[];
  formatCurrency: (n: number) => string;
  t: TFunction;
}) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-[#D9D9D9] bg-white/50 p-4">
        <h4 className="mb-4 text-base font-semibold text-[#E4590F]">{title}</h4>
        <div className="flex h-[300px] items-center justify-center text-sm text-[#2B2B2B]/50">
          {t("noTrendData")}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#D9D9D9] bg-white/50 p-4">
      <h4 className="mb-4 text-base font-semibold text-[#E4590F]">{title}</h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D9D9D9" />
          <XAxis
            dataKey="periodLabel"
            stroke="#2B2B2B"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            yAxisId="left"
            stroke="#2B2B2B"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#2B2B2B"
            style={{ fontSize: "12px" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #D9D9D9",
              borderRadius: "8px",
              padding: "10px",
            }}
            formatter={(value: number | undefined, name: string | undefined) => {
              const v = value ?? 0;
              if (name === "salesCount") {
                return [v, t("policiesCount")];
              }
              if (name === "totalAmount") {
                return [formatCurrency(v), t("salesVolume")];
              }
              if (name === "collectedAmount") {
                return [formatCurrency(v), t("collections")];
              }
              return [v, name || ""];
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: "12px" }}
            formatter={(value: string) => {
              if (value === "salesCount") return t("policiesCount");
              if (value === "totalAmount") return t("salesVolume");
              if (value === "collectedAmount") return t("collections");
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
            dot={{ fill: "#E4590F", r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="totalAmount"
            stroke="#10B981"
            strokeWidth={2}
            name="totalAmount"
            dot={{ fill: "#10B981", r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="collectedAmount"
            stroke="#3B82F6"
            strokeWidth={2}
            name="collectedAmount"
            dot={{ fill: "#3B82F6", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const AdminDashboard = () => {
  const defaultStats = {
    totalSales: 0,
    grossCollected: 0,
    unpaidBalance: 0,
    activeUsers: 0,
    recentSales: [],
  };

  const [stats, setStats] = useState<any>(defaultStats);
  const [trendMonth, setTrendMonth] = useState<TrendPoint[]>([]);
  const [trendYear, setTrendYear] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation(undefined, { keyPrefix: "adminDashboard" });
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    Promise.all([getAdminDashboardApi(), getProductionTrendApi()])
      .then(([dashboardData, trendPayload]) => {
        setStats({ ...defaultStats, ...dashboardData });
        const td = trendPayload as {
          currentMonth?: TrendPoint[];
          currentYear?: TrendPoint[];
        } | null;
        if (td && typeof td === "object" && !Array.isArray(td)) {
          setTrendMonth(Array.isArray(td.currentMonth) ? td.currentMonth : []);
          setTrendYear(Array.isArray(td.currentYear) ? td.currentYear : []);
        } else {
          setTrendMonth([]);
          setTrendYear([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching dashboard stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <p className="text-text-secondary">{t("loading")}</p>
    );
  }

  return (
    <>
      {/* Metrics Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {/* Total Sales */}
        <div className="rounded-2xl border border-[#D9D9D9] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-lg bg-green-500/20 p-2">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <h3 className="mb-1 text-sm font-normal text-text-secondary/70">
            {t("totalSales")}
          </h3>
          <p className="text-primary text-2xl font-semibold">{stats.totalSales}</p>
        </div>
        {/* Gross Collected */}
        <div className="rounded-2xl border border-[#D9D9D9] bg-white p-6 transition-colors hover:bg-secondary/10">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-lg bg-primary/20 p-2">
              <Activity className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h3 className="mb-1 text-sm font-normal text-text-secondary/70">
            {t("grossCollected")}
          </h3>
          <p className="text-primary text-2xl font-semibold">
            {formatCurrency(stats.grossCollected)}
          </p>
        </div>

        {/* Unpaid Balance */}
        <div className="rounded-2xl border border-[#D9D9D9] bg-white p-6 transition-colors hover:bg-secondary/10">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-lg bg-red-500/20 p-2">
              <TrendingDown className="h-6 w-6 text-red-500" />
            </div>
          </div>
          <h3 className="mb-1 text-sm font-normal text-text-secondary/70">
            {t("unpaidBalance")}
          </h3>
          <p className="text-2xl font-semibold text-red-600">
            {formatCurrency(stats.unpaidBalance)}
          </p>
        </div>

        {/* Active Users */}
        <div className="rounded-2xl border border-[#D9D9D9] bg-white p-6 transition-colors hover:bg-secondary/10">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-lg bg-green-500/20 p-2">
              <Users className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <h3 className="mb-1 text-sm font-normal text-text-secondary/70">
            {t("activeUsers")}
          </h3>
          <p className="text-primary text-2xl font-semibold">{stats.activeUsers}</p>
        </div>
      </div>

      {/* Production trends: current month (daily) + current year (monthly) */}
      <div className="mb-6 rounded-2xl border border-[#D9D9D9] bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#E4590F]">
            {t("productionTrend")}
          </h3>
          <div className="rounded-lg bg-primary/20 p-2">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <ProductionTrendChart
            title={t("productionTrendCurrentMonth")}
            data={trendMonth}
            formatCurrency={formatCurrency}
            t={t}
          />
          <ProductionTrendChart
            title={t("productionTrendCurrentYear")}
            data={trendYear}
            formatCurrency={formatCurrency}
            t={t}
          />
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="rounded-2xl border border-[#D9D9D9] bg-white p-6">
        <h3 className="mb-6 text-xl font-semibold text-[#E4590F]">
          {t("recentSales")}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D9D9D9]">
                <th className="px-2 py-4 text-left font-normal text-text-secondary/70">
                  {t("saleId")}
                </th>
                <th className="px-2 py-4 text-center font-normal text-text-secondary/70">
                  {t("traveller")}
                </th>
                <th className="px-2 py-4 text-center font-normal text-text-secondary/70">
                  {t("plan")}
                </th>
                <th className="px-2 py-4 text-center font-normal text-text-secondary/70">
                  {t("total")}
                </th>
                <th className="px-2 py-4 text-center font-normal text-text-secondary/70">
                  {t("paymentStatus")}
                </th>
                <th className="px-2 py-4 text-center font-normal text-text-secondary/70">
                  {t("createdBy")}
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSales.map((sale: any) => (
                <tr
                  key={sale.sale_id}
                  className="border-b border-[#D9D9D9] transition-colors hover:bg-secondary/30"
                >
                  <td className="px-2 py-4">
                    <div className="font-normal text-text-secondary">
                      Sale #{sale.sale_id}
                    </div>
                    <div className="text-sm text-text-secondary/60">
                      Case #{sale.case_id}
                    </div>
                  </td>
                  <td className="px-2 py-4 text-text-secondary/80">
                    <div className="text-center">
                      <div className="font-normal text-text-secondary">
                        {sale.traveller_name}
                      </div>
                      <div className="text-sm text-text-secondary/60">
                        {sale.traveller_phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-text-secondary/80">
                    <div className="text-center">
                      <div className="font-normal text-text-secondary">
                        {sale.plan_name}
                      </div>
                      <div className="text-sm text-text-secondary/60">
                        {sale.product_type}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-text-secondary/80">
                    <div className="text-center">
                      <div className="font-semibold text-text-secondary">
                        {formatCurrency(sale.total)}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex justify-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          sale.payment_status === "Paid"
                            ? "bg-green-500/20 text-green-600"
                            : "bg-red-500/20 text-red-600"
                        }`}
                      >
                        {sale.payment_status}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-text-secondary/80">
                    <div className="text-center">
                      <div className="font-normal text-text-secondary">
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
