import { useState, useCallback } from "react";
 
/* ===================== Types (UI) ===================== */
export interface TemplateItem {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  templateRules: string | null;
  isActive: boolean;
  createdAtUtc: string;
}
 
export interface TemplatesResponse {
  page?: number;
  pageSize?: number;
  total?: number;
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
  isActive?: boolean;   // ignored by API; used only for fallback filtering
  createdBy?: string;   // ignored by API
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  createdFrom?: string; // ISO date YYYY-MM-DD
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
}
 
/* ===================== Fallback data (unchanged) ===================== */
const rawMockTemplates: TemplateItem[] = [
  { id: "1", name: "Template Name", description: "Template description", createdBy: "user1", templateRules: "Rules", isActive: true, createdAtUtc: "2024-07-14T00:00:00Z" },
  { id: "2", name: "New Template", description: "New template description", createdBy: "user2", templateRules: "Rules", isActive: true, createdAtUtc: "2024-06-22T00:00:00Z" },
  { id: "3", name: "Template_Newname", description: "Template description", createdBy: "user3", templateRules: "Rules", isActive: false, createdAtUtc: "2024-06-18T00:00:00Z" },
  { id: "4", name: "Template Name 8", description: "Template description", createdBy: "user4", templateRules: "Rules", isActive: true, createdAtUtc: "2024-05-04T00:00:00Z" },
  { id: "5", name: "Template Name 2", description: "Template description", createdBy: "user5", templateRules: "Rules", isActive: true, createdAtUtc: "2024-07-14T00:00:00Z" },
  { id: "6", name: "Template_New1name", description: "Template description", createdBy: "user2", templateRules: "Rules", isActive: true, createdAtUtc: "2024-07-14T00:00:00Z" },
];
 
const buildHardcoreMocks = (items: TemplateItem[]): TemplateItem[] =>
  items.map((t, i) => ({ ...t, name: `hardcore ${i + 1}` }));
 
const mockUsers: Record<string, string> = {
  user1: "Patricia A. Ramirez",
  user2: "Deloris L. Hall",
  user3: "Carl H. Smith",
  user4: "Ryan M. Johnson",
  user5: "Fannie W. Johnson",
};
 
/* ===================== Config ===================== */
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5074";
 
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("access") : null;
 
const getfirstName = () =>
  typeof window !== "undefined" ? localStorage.getItem("name") : null;
 
/* ===================== Helpers ===================== */
// derive ISO date from MongoDB ObjectId
const objectIdToIso = (id?: string): string => {
  try {
    if (!id || id.length < 8) return new Date().toISOString();
    const ts = parseInt(id.substring(0, 8), 16) * 1000;
    return new Date(ts).toISOString();
  } catch {
    return new Date().toISOString();
  }
};
 
// Map backend Template -> UI TemplateItem (matches updated .NET model)
const mapTemplateDoc = (doc: any): TemplateItem => {
  const id = String(doc?.id ?? doc?.Id ?? "");
  // System.Text.Json defaults to camelCase, so Template_status likely arrives as "template_status"
  const isActive =
    // (typeof doc?.template_status === "boolean" ? doc.template_status : undefined) ??
    (typeof doc?.Template_status === "boolean" ? doc.Template_status : false);
 
  return {
    id,
    name: String(doc?.nameOfTemplate ?? "Untitled"),
    description: null,                 // not in your model
    createdBy: "unknown",              // not in your model (UI resolves to local user)
    templateRules: null,               // not in your model
    isActive,
    createdAtUtc: objectIdToIso(id),
  };
};
 
// Normalize controller PageResult<Template>
const normalizeListResponse = (json: any): { items: TemplateItem[]; total: number } => {
  // Support camelCase and PascalCase PageResult, and raw arrays
  if (json?.Items && Array.isArray(json.Items)) {
    const items = json.Items.map(mapTemplateDoc);
    const total = Number(json.Total ?? items.length);
    return { items, total };
  }
  if (json?.items && Array.isArray(json.items)) {
    const items = json.items.map(mapTemplateDoc);
    const total = Number(json.total ?? items.length);
    return { items, total };
  }
  if (Array.isArray(json)) {
    const items = json.map(mapTemplateDoc);
    return { items, total: items.length };
  }
  return { items: [], total: 0 };
};
 
const isSchemaMismatchError = (text: string) =>
  /does not match any field or property/i.test(text) || /(sections_order|current_step)/i.test(text);
 
/* core fetch for a given page/pageSize */
async function fetchPage({
  search,
  page,
  pageSize,
}: {
  search?: string;
  page: number;
  pageSize: number;
}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
 
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/templates?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res;
}
 
/**
 * Probe mode:
 * When a page fails with the known FormatException, try scanning one-by-one (pageSize=1)
 * and collect up to desiredCount “good” records. Returns null if none can be retrieved.
 */
async function probeCollectGoodItems(
  base: { search?: string },
  desiredCount: number,
  maxProbes = 200
): Promise<{ items: TemplateItem[]; total: number } | null> {
  const items: TemplateItem[] = [];
  let total = 0;
 
  for (let p = 1; p <= maxProbes && items.length < desiredCount; p++) {
    const res = await fetchPage({ search: base.search, page: p, pageSize: 1 });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status >= 500 && isSchemaMismatchError(text)) {
        // skip this record and continue
        continue;
      }
      // different error -> bail out
      return null;
    }
    const json = await res.json();
    const { items: got, total: t } = normalizeListResponse(json);
    total = t || total;
    if (got.length > 0) items.push(got[0]);
  }
 
  if (items.length > 0) {
    return { items, total: total || items.length };
  }
  return null;
}
 
/* ===================== Fallback (filters + pagination) ===================== */
function getFallbackData(filters: TemplateFilters = {}) {
  const hardcore = buildHardcoreMocks(rawMockTemplates);
  let filtered = [...hardcore];
 
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        (t.name ?? "").toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q),
    );
  }
  if (filters.isActive !== undefined) {
    filtered = filtered.filter((t) => t.isActive === filters.isActive);
  }
  if (filters.createdBy) {
    filtered = filtered.filter((t) => t.createdBy === filters.createdBy);
  }

  // Created date range filter
  if (filters.createdFrom) {
    const from = new Date(filters.createdFrom).getTime();
    filtered = filtered.filter(
      (t) => new Date(t.createdAtUtc).getTime() >= from,
    );
  }
  if (filters.createdTo) {
    const to = new Date(filters.createdTo).getTime();
    filtered = filtered.filter((t) => new Date(t.createdAtUtc).getTime() <= to);
  }

  // Updated date range filter
  if (filters.updatedFrom) {
    const from = new Date(filters.updatedFrom).getTime();
    filtered = filtered.filter(
      (t) => new Date(t.updatedAtUtc ?? t.createdAtUtc).getTime() >= from,
    );
  }
  if (filters.updatedTo) {
    const to = new Date(filters.updatedTo).getTime();
    filtered = filtered.filter(
      (t) => new Date(t.updatedAtUtc ?? t.createdAtUtc).getTime() <= to,
    );
  }

  // Sorting
  if (filters.sortBy) {
    const key =
      filters.sortBy === "createdAt" ? "createdAtUtc" : "updatedAtUtc";
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
 
/* ===================== useTemplates ===================== */
export const useTemplates = () => {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
 
  const fetchTemplates = useCallback(async (filters: TemplateFilters = {}) => {
    setLoading(true);
    setError(null);
 
    const fallback = (reason?: string) => {
      if (reason) setError(reason);
      const fb = getFallbackData(filters);
      setTemplates(fb.items);
      setTotalItems(fb.total);
    };
 
    try {
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 12;

      // Use the existing fetchPage helper which correctly constructs query params
      const res = await fetchPage({
        search: filters.search,
        page,
        pageSize,
      });

      // Handle errors and probe mode below
      if (!res.ok) {
        const text = await res.text().catch(() => "");
 
        // 💡 If it's the known schema-mismatch error, try probe mode to salvage data
        if (res.status >= 500 && isSchemaMismatchError(text)) {
          const salvaged = await probeCollectGoodItems(
            { search: filters.search },
            pageSize,
          );
          if (salvaged) {
            setTemplates(salvaged.items);
            setTotalItems(salvaged.total);
            setError(
              "Some records couldn’t be loaded due to a server data mismatch. Showing available items.",
            );
            return;
          }
        }
 
        // generic error → fallback
        return fallback(
          `API Error: ${res.status} ${res.statusText}${
            text ? ` — ${text.slice(0, 200)}` : ""
          }. Showing offline data`,
        );
      }
 
      // success
      const json = await res.json();
      const { items, total } = normalizeListResponse(json);
      setTemplates(items);
      setTotalItems(total);
    } catch (e: any) {
      console.error("Error fetching templates:", e);
      fallback(`${e?.message || "Failed to fetch templates"}. Showing offline data`);
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
 
/* ===================== Users hook (unchanged) ===================== */
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
        const msg = e instanceof Error ? e.message : "Failed to fetch user";
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
 
/* ===================== Utilities (unchanged) ===================== */
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
