import { useEffect, useState } from "react";
import { getAgentDashboardApi } from "../api/agentApi";
import { FileText } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useCurrency } from "../context/CurrencyContext";

interface RecentSale {
  sale_id: number;
  case_id: number;
  policy_number: string;
  certificate_number: string;
  total: number;
  received_amount: number;
  payment_status: string;
  confirmed_at: string;
  traveller_name: string;
  traveller_phone: string;
  plan_name: string;
  product_type: string;
}

const UserDashboard = () => {
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    getAgentDashboardApi()
      .then((data) => {
        setRecentSales(data.recentSales || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      });
  }, []);


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-500/20 text-green-600";
      case "Unpaid":
        return "bg-red-500/20 text-red-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#E4590F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Recent Sales Table */}
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-primary text-xl sm:text-2xl font-semibold">
            {t("recentSales", "Recent Sales")}
          </h2>
        </div>

        <div className="overflow-x-auto relative">
          {recentSales.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-text-secondary/40" />
              <h3 className="mt-2 text-sm font-medium text-text-secondary">
                {t("noSales", "No sales found")}
              </h3>
              <p className="mt-1 text-sm text-text-secondary/60">
                {t("noSalesMessage", "You don't have any sales yet.")}
              </p>
            </div>
          ) : (
            <table className="w-full"> 
              <thead>
                <tr className="border-b border-[#D9D9D9]">
                  <th className="text-left text-text-secondary/70 font-normal py-4 px-2">
                    {t("saleId", "Sale ID")}
                  </th>
                  <th className="text-center text-text-secondary/70 font-normal py-4 px-2 hidden sm:table-cell">
                    {t("traveller", "Traveller")}
                  </th>
                  <th className="text-center text-text-secondary/70 font-normal py-4 px-2 hidden lg:table-cell">
                    {t("createCase.plan", "Plan")}
                  </th>
                  <th className="text-center text-text-secondary/70 font-normal py-4 px-2 hidden sm:table-cell">
                    {t("total", "Total")}
                  </th>
                  <th className="text-center text-text-secondary/70 font-normal py-4 px-2 hidden sm:table-cell">
                    {t("confirmedAt", "Confirmed At")}
                  </th>
                  <th className="text-center text-text-secondary/70 font-normal py-4 px-2">
                    {t("paymentStatus", "Payment Status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr
                    key={sale.sale_id}
                    className="border-b border-[#D9D9D9] hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-4 px-2">
                      <div className="text-text-secondary font-normal">
                        Sale #{sale.sale_id}
                      </div>
                      <div className="text-text-secondary/60 text-sm">
                        Case #{sale.case_id}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-text-secondary/80 hidden sm:table-cell">
                      <div className="text-center">
                        <div className="text-text-secondary font-normal">
                          {sale.traveller_name}
                        </div>
                        <div className="text-text-secondary/60 text-sm">
                          {sale.traveller_phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-text-secondary/80 hidden lg:table-cell">
                      <div className="text-center">
                        <div className="text-text-secondary font-normal">
                          {sale.plan_name}
                        </div>
                        <div className="text-text-secondary/60 text-sm">
                          {sale.product_type}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-text-secondary/80 hidden sm:table-cell">
                      <div className="text-center">
                        <div className="text-text-secondary font-semibold">
                          {formatCurrency(sale.total)}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-text-secondary/80 hidden sm:table-cell">
                      <div className="text-center">
                        <div className="text-text-secondary/80 text-sm">
                          {sale.confirmed_at
                            ? formatDate(sale.confirmed_at)
                            : "-"}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(
                            sale.payment_status
                          )}`}
                        >
                          {sale.payment_status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;