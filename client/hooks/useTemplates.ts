import { useState, useCallback } from "react";

/* ===================== Types (match API: allow nulls) ===================== */
export interface TemplateItem {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  templateRules: string | null;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
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

export type SortBy = "createdAt" | "updatedAt";
export type SortOrder = "asc" | "desc";

export interface TemplateFilters {
  isActive?: boolean;
  createdBy?: string; // ignored (we hardcode below)
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

/* ===================== Original mock data (kept for fallback) ===================== */
const rawMockTemplates: TemplateItem[] = [
  {
    id: "1",
    name: "Template Name",
    description: "Template description",
    createdBy: "user1",
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-07-14T00:00:00Z",
    updatedAtUtc: "2024-07-15T12:00:00Z",
  },
  {
    id: "2",
    name: "New Template",
    description: "New template description",
    createdBy: "user2",
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-06-22T00:00:00Z",
    updatedAtUtc: "2024-06-23T08:30:00Z",
  },
  {
    id: "3",
    name: "Template_Newname",
    description: "Template description",
    createdBy: "user3",
    templateRules: "Rules",
    isActive: false,
    createdAtUtc: "2024-06-18T00:00:00Z",
    updatedAtUtc: "2024-06-19T14:10:00Z",
  },
  {
    id: "4",
    name: "Template Name 8",
    description: "Template description",
    createdBy: "user4",
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-05-04T00:00:00Z",
    updatedAtUtc: "2024-06-01T09:20:00Z",
  },
  {
    id: "5",
    name: "Template Name 2",
    description: "Template description",
    createdBy: "user5",
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-07-14T00:00:00Z",
    updatedAtUtc: "2024-07-16T16:45:00Z",
  },
  {
    id: "6",
    name: "Template_New1name",
    description: "Template description",
    createdBy: "user2",
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-07-14T00:00:00Z",
    updatedAtUtc: "2024-07-14T10:00:00Z",
  },
];

/* Rename mock templates to "hardcore 1..n" for fallback */
const buildHardcoreMocks = (items: TemplateItem[]): TemplateItem[] =>
  items.map((t, i) => ({ ...t, name: `hardcore ${i + 1}` }));

/* Mock users for useUsers fallback */
const mockUsers: Record<string, string> = {
  user1: "Patricia A. Ramirez",
  user2: "Deloris L. Hall",
  user3: "Carl H. Smith",
  user4: "Ryan M. Johnson",
  user5: "Fannie W. Johnson",
};

/* ===================== Config ===================== */
const API_BASE = "http://localhost:5294";

// // For Pranathi 
// const HARDCODED_CREATED_BY = "40945cdc-c62b-4c39-99e1-650c990af422";

// For Yuvraj
const HARDCODED_CREATED_BY = "31e844b2-cba4-48b2-a687-419934046176";


const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("access") : null;

const getfirstName = () =>
  typeof window !== "undefined" ? localStorage.getItem("name") : null;
/* ===================== Fallback (filters + pagination like before) ===================== */
function getFallbackData(filters: TemplateFilters = {}) {
  const hardcore = buildHardcoreMocks(rawMockTemplates);

  let filtered = [...hardcore];

  // Search by name/description (case-insensitive)
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        (t.name ?? "").toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q),
    );
  }

  // isActive filter
  if (filters.isActive !== undefined) {
    filtered = filtered.filter((t) => t.isActive === filters.isActive);
  }

  // createdBy filter (only applies to mocks with user1..5)
  if (filters.createdBy) {
    filtered = filtered.filter((t) => t.createdBy === filters.createdBy);
  }

  // Sorting
  if (filters.sortBy) {
    const key = filters.sortBy === "createdAt" ? "createdAtUtc" : "updatedAtUtc";
    filtered.sort((a, b) => {
      const av = a[key] ? new Date(a[key] as string).getTime() : 0;
      const bv = b[key] ? new Date(b[key] as string).getTime() : 0;
      if (filters.sortOrder === "asc") return av - bv;
      return bv - av;
    });
  }

  // Pagination
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 12;
  const startIndex = (page - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  return { items: paginated, total: filtered.length };
}

/* ===================== Templates hook (REAL API + fallback) ===================== */
export const useTemplates = () => {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  const fetchTemplates = useCallback(async (filters: TemplateFilters = {}) => {
    setLoading(true);
    setError(null);

    const useFallback = (reason?: string) => {
      if (reason) {
        // keep a short, helpful error; UI remains usable with fallback data
        setError(reason);
      }
      const fb = getFallbackData(filters);
      setTemplates(fb.items);
      setTotalItems(fb.total);
    };

    try {
      const token = getToken();
      if (!token) {
        useFallback("No auth token found. Showing offline data.");
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
      if (filters.sortBy) searchParams.append("SortBy", filters.sortBy);
      if (filters.sortOrder) searchParams.append("SortOrder", filters.sortOrder);

      const res = await fetch(
        `${API_BASE}/api/form-templates?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json, text/plain, */*",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        useFallback(
          `API Error: ${res.status} ${res.statusText}${
            text ? ` — ${text.slice(0, 200)}` : ""
          }. Showing offline data.`,
        );
        return;
      }

      const data: TemplatesResponse = await res.json();
      setTemplates(Array.isArray(data.items) ? data.items : []);
      setTotalItems(typeof data.total === "number" ? data.total : 0);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch templates";
      console.error("Error fetching templates:", err);
      useFallback(`${msg}. Showing offline data.`);
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

/* ===================== Users hook (kept simple; mocks by default) ===================== */
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
        // Flip to true and wire your real endpoint if needed.
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
          const userName = getfirstName() || "Unknown User";
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

/* ===================== Utilities (same API as your code) ===================== */
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
