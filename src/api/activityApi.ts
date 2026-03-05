// Activity API functions

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://backend.acareeracademy.com/api";

interface ActivityLogParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const getActivityLogApi = async (params: ActivityLogParams = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);

  const url = `${API_BASE_URL}/activity-log?${queryParams.toString()}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch activity log");
  }

  return response.json();
};

export const deleteActivityApi = async (activityId: number) => {
  const url = `${API_BASE_URL}/activity-log/${activityId}`;
  
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete activity");
  }

  return response.json();
};

export const deleteAllActivitiesApi = async () => {
  const url = `${API_BASE_URL}/activity-log/delete-all`;
  
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete all activities");
  }

  return response.json();
};
