import { useState, useCallback } from "react";

/* ===================== Types (allow nulls like Swagger) ===================== */
export interface TemplateItem {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  templateRules: string | null;
  isActive: boolean;
  createdAtUtc: string;
  // If API later returns this:
  // updatedAtUtc?: string | null;
}

export interface TemplatesResponse {
  page: number;
  pageSize: number;
  total: number;
  items: TemplateItem[];
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: {
    id: number | string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
  };
  errors: string[];
}

export interface TemplateFilters {
  isActive?: boolean;
  createdBy?: string; // ignored (we hardcode below)
  search?: string;
  page?: number;
  pageSize?: number;
}

/* ===================== Dev mocks (kept for users hook fallback) ===================== */
const mockUsers: Record<string, string> = {
  user1: "Patricia A. Ramirez",
  user2: "Deloris L. Hall",
  user3: "Carl H. Smith",
  user4: "Ryan M. Johnson",
  user5: "Fannie W. Johnson",
};

/* ===================== Config ===================== */
const API_BASE = "http://localhost:5294";
const HARDCODED_CREATED_BY = "31e844b2-cba4-48b2-a687-419934046176";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("access") : null;

/* ===================== Templates hook (REAL API) ===================== */
export const useTemplates = () => {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  const fetchTemplates = useCallback(async (filters: TemplateFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        setError("No auth token found. Please log in.");
        setTemplates([]);
        setTotalItems(0);
        return;
      }

      const searchParams = new URLSearchParams();
      const isActive = filters.isActive ?? true; // default true like your example
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 20;

      searchParams.append("IsActive", String(isActive));
      searchParams.append("CreatedBy", HARDCODED_CREATED_BY); // hardcoded as requested
      searchParams.append("Page", String(page));
      searchParams.append("PageSize", String(pageSize));
      if (filters.search) searchParams.append("Search", filters.search);

      const res = await fetch(
        `${API_BASE}/api/form-templates?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            // Server returns JSON even if Swagger shows text/plain
            Accept: "application/json, text/plain, */*",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(
          `API Error: ${res.status} ${res.statusText}${
            text ? ` — ${text.slice(0, 200)}` : ""
          }`,
        );
        setTemplates([]);
        setTotalItems(0);
        return;
      }

      const data: TemplatesResponse = await res.json();
      setTemplates(Array.isArray(data.items) ? data.items : []);
      setTotalItems(typeof data.total === "number" ? data.total : 0);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch templates";
      setError(msg);
      console.error("Error fetching templates:", err);
      setTemplates([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    templates,
    loading,
    error,
    totalItems,
    fetchTemplates,
    refetch: fetchTemplates,
  };
};

/* ===================== Users hook (safe fallback) ===================== */
/* Keeps your current API surface. It returns mock names for non-mock IDs
   (your GUIDs will show "Unknown User" unless you wire the real endpoint). */
export const useUsers = () => {
  const [users, setUsers] = useState<Record<string, string>>(mockUsers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(
    async (userId: string): Promise<string> => {
      if (users[userId]) return users[userId];

      setLoading(true);
      setError(null);

      try {
        // Flip to true and adjust the URL if your API supports /api/User/{id}
        const useRealAPI = false;

        if (useRealAPI) {
          const token = getToken();
          if (!token) throw new Error("No auth token found");

          const res = await fetch(`${API_BASE}/api/User/${userId}`, {
            headers: {
              Accept: "application/json, text/plain, */*",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(
              `User API Error: ${res.status} ${res.statusText}${
                text ? ` — ${text.slice(0, 200)}` : ""
              }`,
            );
          }

          const data: UserResponse = await res.json();
          const fullName = data?.data
            ? `${data.data.firstName} ${data.data.lastName}`.trim()
            : "Unknown User";
          setUsers((prev) => ({ ...prev, [userId]: fullName }));
          return fullName;
        } else {
          const userName = mockUsers[userId] || "Unknown User";
          setUsers((prev) => ({ ...prev, [userId]: userName }));
          return userName;
        }
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Failed to fetch user";
        setError(msg);
        console.error("Error fetching user:", e);
        return "Unknown User";
      } finally {
        setLoading(false);
      }
    },
    [users],
  );

  const fetchMultipleUsers = useCallback(
    async (userIds: string[]) => {
      const unique = Array.from(new Set(userIds)).filter(Boolean);
      await Promise.all(unique.map((id) => fetchUser(id)));
    },
    [fetchUser],
  );

  return { users, loading, error, fetchUser, fetchMultipleUsers };
};

/* ===================== Utilities (unchanged API) ===================== */
export const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const getStatusInfo = (isActive: boolean) => {
  return {
    label: isActive ? "Completed" : "In Progress",
    className: isActive
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800",
  };
};
