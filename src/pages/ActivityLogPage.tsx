import React, { useState, useEffect } from "react";
import { getActivityLogApi, deleteActivityApi, deleteAllActivitiesApi } from "../api/activityApi.ts";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  XCircle,
  User,
  Clock,
  Activity,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

interface ActivityEntry {
  id: number;
  user_id: number;
  activity_type: string;
  activity_date: string;
  user_name: string;
  user_email: string;
}

const ActivityLogPage: React.FC = () => {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const itemsPerPage = 25;

  const fetchActivities = async (
    page: number = 1,
    search: string = "",
    start: string = "",
    end: string = ""
  ) => {
    try {
      setLoading(true);
      const response = await getActivityLogApi({
        page,
        limit: itemsPerPage,
        search,
        startDate: start,
        endDate: end,
      });

      const data = response as any;
      setActivities(data.data || []);
      setTotalEntries(data.meta?.total || 0);
      setTotalPages(Math.ceil((data.meta?.total || 0) / itemsPerPage));
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      toast.error("Failed to load activity log");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Always call API when any filter changes, including when filters are cleared
      setCurrentPage(1);
      fetchActivities(1, searchTerm, startDate, endDate);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, startDate, endDate]);

  useEffect(() => {
    fetchActivities(currentPage, searchTerm, startDate, endDate);
  }, [currentPage]);

  const handleDeleteActivity = async (activityId: number) => {
    try {
      setActionLoading(activityId);
      await deleteActivityApi(activityId);
      toast.success("Activity deleted successfully");
      await fetchActivities(
        currentPage,
        searchTerm,
        startDate,
        endDate
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete activity");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setActionLoading(-1); // Special ID for delete all
      await deleteAllActivitiesApi();
      toast.success("All activities deleted successfully");
      await fetchActivities(
        currentPage,
        searchTerm,
        startDate,
        endDate
      );
      setShowDeleteAllModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete all activities");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityTypeColor = (activityType: string) => {
    switch (activityType.toLowerCase()) {
      case "login":
        return "bg-green-50 border border-green-200 text-green-600";
      case "logout":
        return "bg-red-50 border border-red-200 text-red-600";
      case "create_case":
        return "bg-blue-50 border border-blue-200 text-blue-600";
      case "create_sale":
        return "bg-purple-50 border border-purple-200 text-purple-600";
      case "update_payment":
        return "bg-yellow-50 border border-yellow-200 text-yellow-600";
      default:
        return "bg-[#D9D9D9]/30 border border-[#D9D9D9] text-[#2B2B2B]/70";
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
      {/* --- Activity Log Table Section --- */}
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-[#E4590F] text-2xl font-semibold">
            {t("activityLog.title", "Activity Log")}
          </h2>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder={t("activityLog.search", "Search activities...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] placeholder-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:ring-[#E4590F] font-normal"
            />
            <input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] font-normal"
            />
            <input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] font-normal"
            />
            <button
              onClick={() => {
                setCurrentPage(1);
                fetchActivities(1, searchTerm, startDate, endDate);
              }}
              className="px-4 py-2 bg-[#E4590F] hover:bg-[#C94A0D] text-white rounded-xl transition-colors font-medium"
            >
              {t("activityLog.search", "Search")}
            </button>
            <button
              onClick={() => {
                setSearchTerm("");
                setStartDate("");
                setEndDate("");
                setCurrentPage(1);
                fetchActivities(1, "", "", "");
              }}
              className="px-4 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] rounded-xl transition-colors font-medium"
            >
              {t("activityLog.clear", "Clear")}
            </button>
            {/* <button
              onClick={() => setShowDeleteAllModal(true)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              {t("activityLog.deleteAll", "Delete All")}
            </button> */}
          </div>
        </div>

        <div className="overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex items-center gap-3 text-[#2B2B2B]">
                <div className="w-6 h-6 border-2 border-[#D9D9D9] border-t-[#E4590F] rounded-full animate-spin"></div>
                <span className="font-normal">{t("activityLog.loading", "Loading activities...")}</span>
              </div>
            </div>
          )}

          {activities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-[#2B2B2B]/40" />
              <h3 className="mt-2 text-sm font-semibold text-[#2B2B2B]">
                {t("activityLog.noActivities", "No activities found")}
              </h3>
              <p className="mt-1 text-sm text-[#2B2B2B]/60 font-normal">
                {t("activityLog.noActivitiesMessage", "No activities have been recorded yet.")}
              </p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D9D9D9]">
                    <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2">
                      {t("activityLog.user", "User")}
                    </th>
                    <th className="text-center text-[#2B2B2B]/70 font-normal py-4 px-2 hidden sm:table-cell">
                      {t("activityLog.activityType", "Activity Type")}
                    </th>
                    <th className="text-center text-[#2B2B2B]/70 font-normal py-4 px-2 hidden lg:table-cell">
                      {t("activityLog.date", "Date")}
                    </th>
                    <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2">
                      {t("activityLog.actions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr
                      key={activity.id}
                      className="border-b border-[#D9D9D9] hover:bg-[#D9D9D9]/30 transition-colors"
                    >
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E4590F]/10 border border-[#E4590F]/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-[#E4590F]" />
                          </div>
                          <div>
                            <div className="text-[#2B2B2B] font-semibold">
                              {activity.user_name}
                            </div>
                            <div className="text-[#2B2B2B]/60 text-sm font-normal">
                              {activity.user_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 hidden sm:table-cell">
                        <div className="text-center">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-medium rounded-lg ${getActivityTypeColor(
                              activity.activity_type
                            )}`}
                          >
                            {activity.activity_type.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-2 hidden lg:table-cell">
                        <div className="text-center">
                          <div className="text-[#2B2B2B] text-sm flex items-center justify-center gap-1 font-normal">
                            <Clock className="w-3 h-3 text-[#E4590F]" />
                            {formatDate(activity.activity_date)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteActivity(activity.id)}
                            disabled={actionLoading === activity.id}
                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                            title={t("activityLog.deleteActivity", "Delete Activity")}
                          >
                            {actionLoading === activity.id ? (
                              <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-[#D9D9D9]">
                <div className="text-[#2B2B2B]/70 text-sm font-normal">
                  {t("activityLog.showing", "Showing")}{" "}
                  <span className="font-semibold text-[#2B2B2B]">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  {t("activityLog.to", "to")}{" "}
                  <span className="font-semibold text-[#2B2B2B]">
                    {Math.min(currentPage * itemsPerPage, totalEntries)}
                  </span>{" "}
                  {t("activityLog.of", "of")}{" "}
                  <span className="font-semibold text-[#2B2B2B]">{totalEntries}</span>{" "}
                  {t("activityLog.results", "results")}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] border border-[#D9D9D9] rounded-xl text-[#2B2B2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          page === currentPage
                            ? "bg-[#E4590F] text-white"
                            : "bg-[#D9D9D9] text-[#2B2B2B] hover:bg-[#B8B8B8]"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] border border-[#D9D9D9] rounded-xl text-[#2B2B2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#E4590F] text-xl font-semibold">
                {t("activityLog.confirmDeleteAll", "Confirm Delete All")}
              </h3>
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="p-2 rounded-lg bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-[#2B2B2B] font-semibold">
                    {t(
                      "activityLog.confirmDeleteAllTitle",
                      "Are you sure you want to delete all activities?"
                    )}
                  </p>
                  <p className="text-[#2B2B2B]/70 text-sm mt-1 font-normal">
                    {t(
                      "activityLog.confirmDeleteAllMessage",
                      "This action cannot be undone. All activity records will be permanently deleted."
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-[#D9D9D9]">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] rounded-xl transition-colors font-medium"
              >
                {t("activityLog.cancel", "Cancel")}
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={actionLoading === -1}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 font-medium"
              >
                {actionLoading === -1 ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  t("activityLog.deleteAll", "Delete All")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogPage;
