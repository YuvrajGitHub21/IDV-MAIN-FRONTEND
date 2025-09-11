import { useState, useCallback } from "react";

/* ===================== Types (UI) ===================== */
export interface TemplateItem {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  templateRuleId : number | null;
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
    templateRuleId: 1,
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-07-14T00:00:00Z",
  },
  {
    id: "2",
    name: "New Template",
    description: "New template description",
    createdBy: "user2",
    templateRuleId: 1,
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-06-22T00:00:00Z",
  },
  {
    id: "3",
    name: "Template_Newname",
    description: "Template description",
    createdBy: "user3",
    templateRuleId: 1,
    templateRules: "Rules",
    isActive: false,
    createdAtUtc: "2024-06-18T00:00:00Z",
  },
  {
    id: "4",
    name: "Template Name 8",
    description: "Template description",
    createdBy: "user4",
    templateRuleId: 1,
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-05-04T00:00:00Z",
  },
  {
    id: "5",
    name: "Template Name 2",
    description: "Template description",
    createdBy: "user5",
    templateRuleId: 1,
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-07-14T00:00:00Z",
  },
  {
    id: "6",
    name: "Template_New1name",
    description: "Template description",
    createdBy: "user2",
    templateRuleId: 1,
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
// const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5027";
const API_BASE = "http://10.10.2.133:8080";

const getToken = () => {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("access_token") || localStorage.getItem("access")
    );
  }
  return null;
};

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
// Map backend Template -> UI TemplateItem (matches current /api/Template schema)
const mapTemplateDoc = (doc: any): TemplateItem => {
  const id = String(doc?.id ?? doc?.Id ?? "");
  const name = String(doc?.name ?? "Untitled");

  // Prefer the display name; fall back to numeric createdBy or a placeholder
  const createdBy: string =
    (doc?.createdByName && String(doc.createdByName)) ??
    (doc?.createdBy !== undefined ? String(doc.createdBy) : "Unknown User");

  const description: string | null =
    doc?.description !== undefined && doc?.description !== null
      ? String(doc.description)
      : null;

  // Use templateRuleId here (which is numeric)
  const templateRuleId: number | null =
    doc?.templateRuleId !== undefined ? doc.templateRuleId : null;
  // Template rules text if present

  const templateRules: string | null =
    doc?.templateRuleInfo !== undefined && doc?.templateRuleInfo !== null
      ? String(doc.templateRuleInfo)
      : null;

  // Dates
  const createdAtUtc = doc?.createdAt
    ? new Date(doc.createdAt).toISOString()
    : objectIdToIso(id);

  const updatedAtUtc =
    doc?.updatedAt && !isNaN(new Date(doc.updatedAt).getTime())
      ? new Date(doc.updatedAt).toISOString()
      : undefined;

  // Your API doesn't expose an "active/completed" flag; keep a stable default
  const isActive = true;

  return {
    id,
    name,
    description,
    createdBy,
    templateRuleId,
    templateRules,
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
/* core fetch */
// async function fetchPage(
//   filters: Partial<TemplateFilters> & { page: number; pageSize: number },
// ) {
//   const params = new URLSearchParams();

//   // If your API eventually supports search, keep this; otherwise it will be ignored harmlessly
//   if (filters.search) params.set("search", filters.search);

//   const qs = params.toString();
//   const token = getToken();

//   const res = await fetch(
//     `${API_BASE}/api/Template${qs ? `?${qs}` : ""}`,
//     {
//       method: "GET",
//       headers: {
//         Accept: "application/json",
//         ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       },
//     },
//   );

//   return res;
// }
async function fetchPage() {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/Template`, {
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
    const res = await fetchPage();
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
// export const useTemplates = () => {
//   const [templates, setTemplates] = useState<TemplateItem[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [totalItems, setTotalItems] = useState(0);

//   const fetchTemplates = useCallback(async (filters: TemplateFilters = {}) => {
//     setLoading(true);
//     setError(null);

//     const fallback = (reason?: string) => {
//       if (reason) setError(reason);
//       const fb = getFallbackData(filters);
//       setTemplates(fb.items);
//       setTotalItems(fb.total);
//     };

//     try {
//       const page = filters.page ?? 1;
//       const pageSize = filters.pageSize ?? 12;

//       const res = await fetchPage({
//         ...filters,
//         page,
//         pageSize,
//       });

//       if (!res.ok) {
//         const text = await res.text().catch(() => "");

//         // Try probe mode if this is the known schema mismatch coming from Mongo driver
//         if (res.status >= 500 && isSchemaMismatchError(text)) {
//           const salvaged = await probeCollectGoodItems(
//             { search: filters.search },
//             pageSize,
//           );
//           if (salvaged) {
//             setTemplates(salvaged.items);
//             setTotalItems(salvaged.total);
//             setError(
//               "Some records couldn’t be loaded due to a server data mismatch. Showing available items.",
//             );
//             return;
//           }
//         }

//         return fallback(
//           `API Error: ${res.status} ${res.statusText}${
//             text ? ` — ${text.slice(0, 200)}` : ""
//           }. Showing offline data`,
//         );
//       }

//       const json = await res.json();
//       const { items, total } = normalizeListResponse(json);
//       setTemplates(items);
//       setTotalItems(total);
//     } catch (e: any) {
//       console.error("Error fetching templates:", e);
//       fallback(
//         `${e?.message || "Failed to fetch templates"}. Showing offline data`,
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   return {
//     templates,
//     loading,
//     error,
//     totalItems,
//     fetchTemplates,
//     refetch: fetchTemplates,
//   };
// };


export const useTemplates = () => {
  const [allTemplates, setAllTemplates] = useState<TemplateItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPage();
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const json = await res.json();
      const { items } = normalizeListResponse(json);
      setAllTemplates(items);   // store full dataset
      setTotalItems(items.length);
    } catch (e: any) {
      setError(e.message);
      setAllTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters client-side
  const applyFilters = useCallback((filters: TemplateFilters) => {
    let filtered = [...allTemplates];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.name ?? "").toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      );
    }

    if (filters.isActive !== undefined) {
      filtered = filtered.filter((t) => t.isActive === filters.isActive);
    }

    if (filters.createdBy) {
      filtered = filtered.filter((t) => t.createdBy === filters.createdBy);
    }

    // Date filters
    if (filters.createdFrom) {
      filtered = filtered.filter(
        (t) => new Date(t.createdAtUtc) >= new Date(filters.createdFrom!)
      );
    }
    if (filters.createdTo) {
      filtered = filtered.filter(
        (t) => new Date(t.createdAtUtc) <= new Date(filters.createdTo!)
      );
    }
    if (filters.updatedFrom) {
      filtered = filtered.filter(
        (t) => new Date(t.updatedAtUtc ?? t.createdAtUtc) >= new Date(filters.updatedFrom!)
      );
    }
    if (filters.updatedTo) {
      filtered = filtered.filter(
        (t) => new Date(t.updatedAtUtc ?? t.createdAtUtc) <= new Date(filters.updatedTo!)
      );
    }

    // Sorting
    if (filters.sortBy) {
      const key = filters.sortBy === "createdAt" ? "createdAtUtc" : "updatedAtUtc";
      filtered.sort((a, b) => {
        const av = a[key] ? new Date(a[key] as string).getTime() : 0;
        const bv = b[key] ? new Date(b[key] as string).getTime() : 0;
        return filters.sortOrder === "asc" ? av - bv : bv - av;
      });
    }

    // Pagination
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 12;
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    setTemplates(paginated);
    setTotalItems(filtered.length);
  }, [allTemplates]);

  return {
    templates,
    allTemplates,
    loading,
    error,
    totalItems,
    fetchTemplates,
    applyFilters,
  };
};


/* ===================== Create (POST /api/template) ===================== */
/**
 * Create a new template using the new backend TemplateController.
 * Uses TemplateCreateDto structure with Name, Description, and TemplateRuleId.
 * Returns the new template with proper casing (Id, Name).
 */
export async function createTemplateMin(
  nameOfTemplate: string,
): Promise<{ id: string; name: string }> {
  const token = getToken();

  const res = await fetch(`${API_BASE}/api/template`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      Name: nameOfTemplate,
      Description: null, // Optional field
      TemplateRuleId: 1, // Default value, adjust as needed
    }),
  });

  if (!res.ok) {
    let raw = "";
    try {
      raw = await res.text();
    } catch {}

    let backendMsg = "";
    try {
      const json = raw ? JSON.parse(raw) : null;
      const objErrors =
        json?.errors && typeof json.errors === "object"
          ? Object.values(json.errors).flat().join(", ")
          : "";
      backendMsg =
        json?.message ||
        json?.Message ||
        json?.error ||
        json?.Error ||
        (Array.isArray(json?.errors) ? json.errors.join(", ") : objErrors) ||
        json?.title ||
        json?.Title ||
        json?.detail ||
        json?.Detail ||
        "";
    } catch {}

    const msg = (
      backendMsg ||
      raw ||
      `Request failed with ${res.status} ${res.statusText}`
    )
      .toString()
      .trim()
      .slice(0, 300);
    throw new Error(msg);
  }

  const doc = await res.json();
  const id = String(doc?.Id ?? doc?.id ?? "");
  const name = String(doc?.Name ?? doc?.name ?? nameOfTemplate ?? "Untitled");
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
