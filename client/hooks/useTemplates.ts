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
  updatedAtUtc?: string;
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

export type SortBy = "createdAt" | "updatedAt";
export type SortOrder = "asc" | "desc";

export interface TemplateFilters {
  isActive?: boolean; // ignored by API; used only for fallback filtering
  createdBy?: string; // ignored by API
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
  {
    id: "1",
    name: "Template Name",
    description: "Template description",
    createdBy: "user1",
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-07-14T00:00:00Z",
  },
  {
    id: "2",
    name: "New Template",
    description: "New template description",
    createdBy: "user2",
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-06-22T00:00:00Z",
  },
  {
    id: "3",
    name: "Template_Newname",
    description: "Template description",
    createdBy: "user3",
    templateRules: "Rules",
    isActive: false,
    createdAtUtc: "2024-06-18T00:00:00Z",
  },
  {
    id: "4",
    name: "Template Name 8",
    description: "Template description",
    createdBy: "user4",
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-05-04T00:00:00Z",
  },
  {
    id: "5",
    name: "Template Name 2",
    description: "Template description",
    createdBy: "user5",
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-07-14T00:00:00Z",
  },
  {
    id: "6",
    name: "Template_New1name",
    description: "Template description",
    createdBy: "user2",
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-07-14T00:00:00Z",
  },
];

const buildHardcoreMocks = (items: TemplateItem[]): TemplateItem[] =>
  items.map((t, i) => ({ ...t, name: `hardcoded ${i + 1}` }));
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

  // Status from Template_status
  const isActive =
    typeof doc?.Template_status === "boolean" ? doc.Template_status : false;

  // Created by / dates from new dashboard fields
  const createdBy = String(doc?.created_by ?? "Unknown User");

  const createdAtUtc = (() => {
    const raw = doc?.created_template_date;
    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    return objectIdToIso(id);
  })();

  const updatedAtUtc = (() => {
    const raw = doc?.last_updated;
    if (!raw) return undefined;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  })();

  return {
    id,
    name: String(doc?.nameOfTemplate ?? "Untitled"),
    description: null, // not in your model
    createdBy,
    templateRules: null, // not in your model
    isActive,
    createdAtUtc,
    updatedAtUtc,
  };
};

// Normalize controller PageResult<Template>
const normalizeListResponse = (
  json: any,
): { items: TemplateItem[]; total: number } => {
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
  /does not match any field or property/i.test(text) ||
  /(sections_order|current_step)/i.test(text);

/* core fetch for a given page/pageSize */
async function fetchPage(filters: Partial<TemplateFilters> & { page: number; pageSize: number }) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.isActive !== undefined) params.set("isActive", String(filters.isActive));
  if (filters.createdBy) params.set("createdBy", String(filters.createdBy));
  if (filters.sortBy) params.set("sortBy", String(filters.sortBy));
  if (filters.sortOrder) params.set("sortOrder", String(filters.sortOrder));
  if (filters.createdFrom) params.set("createdFrom", filters.createdFrom);
  if (filters.createdTo) params.set("createdTo", filters.createdTo);
  if (filters.updatedFrom) params.set("updatedFrom", filters.updatedFrom);
  if (filters.updatedTo) params.set("updatedTo", filters.updatedTo);

  params.set("page", String(filters.page));
  params.set("pageSize", String(filters.pageSize));

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
  maxProbes = 200,
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

      const res = await fetchPage({
        ...filters,
        page,
        pageSize,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");

        // Try probe mode if this is the known schema mismatch coming from Mongo driver
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

        return fallback(
          `API Error: ${res.status} ${res.statusText}${
            text ? ` — ${text.slice(0, 200)}` : ""
          }. Showing offline data`,
        );
      }

      const json = await res.json();
      const { items, total } = normalizeListResponse(json);
      setTemplates(items);
      setTotalItems(total);
    } catch (e: any) {
      console.error("Error fetching templates:", e);
      fallback(
        `${e?.message || "Failed to fetch templates"}. Showing offline data`,
      );
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

/* ===================== Create (POST /api/templates/create-min) ===================== */
/**
 * Create a new template with just the name. The server sets:
 * - created_by (from the JWT)
 * - created_template_date
 * - last_updated
 * Returns the new id + name.
 */
export async function createTemplateMin(
  nameOfTemplate: string,
  sectionsOrder: string[] = [
    "Personal_info",
    "Doc_verification",
    "Biometric_verification",
  ],
): Promise<{ id: string; name: string }> {
  const token = getToken();

  const res = await fetch(`${API_BASE}/api/templates/create-min`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      nameOfTemplate,
      sections_order: sectionsOrder,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to create template: ${res.status} ${res.statusText}${
        text ? " — " + text.slice(0, 200) : ""
      }`,
    );
  }

  const doc = await res.json();
  const id = String(doc?.id ?? doc?.Id ?? "");
  const name = String(doc?.nameOfTemplate ?? nameOfTemplate ?? "Untitled");
  return { id, name };
}

/* ===================== Users hook (patched to not override names) ===================== */
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
        const useRealAPI = false; // keep toggleable
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
          // IMPORTANT: Do not force localStorage name. Mirror provided id/name.
          const display = userId || "Unknown User";
          setUsers((prev) => ({ ...prev, [userId]: display }));
          return display;
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
