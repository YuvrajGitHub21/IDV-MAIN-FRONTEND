import React, { useEffect, useState, useRef } from "react";
import { X, Search, Filter, Download, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DepartmentFilterDropdown from "./DepartmentFilterDropdown";

interface Employee {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarColor: string;
  department: string;
  selected: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://10.10.2.133:8080";
const DEFAULT_DEPARTMENT = "Marketing";
const getToken = () =>
  (typeof window !== "undefined" && localStorage.getItem("access")) || null;

type BackendUser = {
  id: number | string;
  firstName?: string;
  lastName?: string;
  email: string;
  roleId?: number | string;
  roleName?: string;
};

interface SendInviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateId?: string; // ← passed from Templates when clicking "Send Invite"
}

const DEPARTMENTS = [
  "Human Resources",
  "Finance",
  "Marketing",
  "Sales",
  "Customer Support",
  "IT & Security",
  "Legal",
  "Operations",
];

const SAMPLE_EMPLOYEES: Employee[] = [
  { id: "1", name: "Roger G. Rhone", email: "RogerGRhone@teleworm.us", initials: "OP", avatarColor: "#F4DEE4", department: "Operations", selected: true },
  { id: "2", name: "Mike J. Torres", email: "MikeJTorres@rhyta.com", initials: "MT", avatarColor: "#D6ECF5", department: "IT & Security", selected: false },
  { id: "3", name: "Wanda C. Moore", email: "WandaCMoore@dayrep.com", initials: "WM", avatarColor: "#E0DAEE", department: "Marketing", selected: false },
  { id: "4", name: "Roy C. Kephart", email: "RoyCKephart@dayrep.com", initials: "RK", avatarColor: "#FFE6DE", department: "Sales", selected: true },
  { id: "5", name: "Lois S. Spencer", email: "LoisSSpencer@rhyta.com", initials: "LS", avatarColor: "#DAE5E6", department: "Finance", selected: false },
  { id: "6", name: "Jerry T. Beavers", email: "JerryTBeavers@teleworm.us", initials: "JB", avatarColor: "#F4EBE8", department: "Human Resources", selected: false },
];

// helpers
const initialsOf = (f?: string, l?: string) =>
  ((f?.[0] || "") + (l?.[0] || "")).toUpperCase() || "??";

const hashCode = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};
const pickColor = (seed: string) => {
  const palette = ["#F4DEE4", "#D6ECF5", "#E0DAEE", "#FFE6DE", "#DAE5E6", "#F4EBE8"];
  return palette[hashCode(seed) % palette.length];
};

const mapUserToEmployee = (u: BackendUser): Employee => {
  const id = String(u.id ?? u.email);
  const name =
    (u.firstName || u.lastName)
      ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
      : u.email;

  return {
    id,
    name,
    email: u.email,
    initials: initialsOf(u.firstName, u.lastName),
    avatarColor: pickColor(id),
    department: DEFAULT_DEPARTMENT, // backend does not provide department yet
    selected: false,
  };
};

export default function SendInviteDialog({
  isOpen,
  onClose,
  templateId,
}: SendInviteDialogProps) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"select" | "bulk">("select");
  const [employees, setEmployees] = useState<Employee[]>(SAMPLE_EMPLOYEES);
  const [sending, setSending] = useState(false);

  const [versionId, setVersionId] = useState<number | null>(null);
  const [loadingVersion, setLoadingVersion] = useState(false);

  // Resolve versionId: prefer fetching from templateId; else fallback to LS
  useEffect(() => {
    if (!isOpen) return;

    const token = getToken();
    if (!token) {
      setVersionId(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoadingVersion(true);

        if (templateId) {
          const r = await fetch(`${API_BASE}/api/Template/${templateId}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          });
          if (!r.ok) throw new Error(`Template fetch failed: ${r.status}`);
          // const j = await r.json();

          // const vid =
          //   j?.activeVersion?.versionId ??
          //   null;

          // if (!cancelled) setVersionId(vid != null ? Number(vid) : null);
          const j = await r.json();

          // Pick the active version from the array
          const active = j?.versions?.find(v => v.isActive);
          const vid = active?.versionId ?? null;

          if (!cancelled) setVersionId(vid != null ? Number(vid) : null);

        } else {
          // fallback if opening from a screen where only LS is available
          const fromLS = Number(localStorage.getItem("arcon_latest_version_id"));
          if (!cancelled) setVersionId(Number.isFinite(fromLS) ? fromLS : null);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setVersionId(null);
        toast.error("Couldn't load template version.");
      } finally {
        if (!cancelled) setLoadingVersion(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, templateId]);

  // fetch users (filter by roleId === 2)
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const controller = new AbortController();

    (async function loadInvitees() {
      try {
        const token = getToken();
        if (!token) {
          console.warn("No auth token; using sample invitees.");
          return;
        }

        const res = await fetch(`${API_BASE}/api/Users`, {
          method: "GET",
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok) {
          console.warn(`Users fetch failed: ${res.status}`);
          return;
        }

        const json = await res.json();
        const rawList: BackendUser[] =
          Array.isArray(json) ? json :
          Array.isArray(json?.data) ? json.data :
          Array.isArray(json?.items) ? json.items : [];

        const onlyRole2 = rawList.filter((u) => Number(u.roleId) === 2);
        const mapped = onlyRole2.map(mapUserToEmployee);

        if (isMounted && mapped.length) setEmployees(mapped);
      } catch (e) {
        console.warn("Failed to load /api/Users:", e);
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [isOpen]);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadIntervalRef = useRef<number | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
        uploadIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen && uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      emp.name.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q);
    const matchesDepartment =
      selectedDepartments.length === 0 ||
      selectedDepartments.includes(emp.department);
    return matchesSearch && matchesDepartment;
  });

  const selectedCount = employees.filter((emp) => emp.selected).length;

  const handleSelectEmployee = (id: string) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, selected: !emp.selected } : emp)),
    );
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setEmployees((prev) => prev.map((emp) => ({ ...emp, selected: newSelectAll })));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    const name = file.name.toLowerCase();
    const ext = name.slice(name.lastIndexOf(".") + 1);
    const limits: Record<string, number> = {
      csv: 10 * 1024 * 1024, // 10 MB
      xls:  5 * 1024 * 1024, // 5 MB
      xlsx: 10 * 1024 * 1024 // 10 MB
    };
    if (!limits[ext]) {
      toast.error("Only CSV, XLS, and XLSX files are supported.");
      event.currentTarget.value = "";
      return;
    }
    if (file.size > limits[ext]) {
      const mb = ext === "xls" ? 5 : 10;
      toast.error(`${ext.toUpperCase()} files must be ≤ ${mb} MB.`);
      event.currentTarget.value = "";
      return;
    }

    setUploadedFile(file);
    setUploadProgress(0);

    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }

    const id = window.setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          if (uploadIntervalRef.current) {
            clearInterval(uploadIntervalRef.current);
            uploadIntervalRef.current = null;
          }
          return 100;
        }
        return prev + 20;
      });
    }, 200);

    uploadIntervalRef.current = id;
  };

  // CSV download: sample format (name, email, department)
  const handleDownloadSample = () => {
    // CSV utils
    const escapeCsv = (v: string | number) =>
      `"${String(v).replace(/"/g, '""')}"`;
    const toRow = (cols: (string | number)[]) => cols.map(escapeCsv).join(',');

    // Headers + a few sample rows (use your in-file SAMPLE_EMPLOYEES)
    const headers = ['name', 'email'];
    const rows = SAMPLE_EMPLOYEES.slice(0, 5).map(e => [e.name, e.email]);

    // Prepend BOM so Excel opens UTF-8 correctly
    const csvText = '\uFEFF' + [toRow(headers), ...rows.map(toRow)].join('\r\n');

    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invitees-sample.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // API call to send invites
  const handleSendInvite = async () => {
    const token = getToken();
    const selected = employees.filter((e) => e.selected);

    if (selected.length === 0) { toast.info("Select at least one invitee first."); return; }
    if (!token) { toast.error("You’re not signed in. Please log in and try again."); return; }
    if (versionId == null) { toast.error("Missing template version. Open from a template and try again."); return; }

    setSending(true);
    try {
      const results = await Promise.allSettled(
        selected.map(async (emp) => {
          const res = await fetch(`${API_BASE}/api/Invitations/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              versionId,
              email: emp.email,
              name: emp.name,
            }),
          });
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
          }
          return true;
        }),
      );

      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;

      if (ok > 0 && fail === 0) {
        toast.success(`Invites sent to ${ok} ${ok === 1 ? "person" : "people"}.`);
        onClose();
        navigate("/dashboard");
      } else if (ok > 0) {
        toast.warning(`Sent ${ok}, failed ${fail}. You can retry the failed ones.`);
      } else {
        toast.error("All invitations failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong sending invites.");
    } finally {
      setSending(false);
    }
  };

  const sendDisabled = sending || selectedCount === 0 || loadingVersion || versionId == null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-[800px] max-h-[640px] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#D0D4E4]">
          <h2 className="text-lg font-bold text-[#323238] font-figtree">Send Invite</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-50">
            <X className="w-5 h-5 text-[#676879]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#D0D4E4] px-5">
          <button
            onClick={() => setActiveTab("select")}
            className={`px-2 py-2 text-sm font-roboto ${activeTab === "select" ? "text-[#172B4D] border-b-2 border-[#0073EA]" : "text-[#505258]"}`}
          >
            Select Invitees
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-2 py-2 text-sm font-roboto ml-2 ${activeTab === "bulk" ? "text-[#172B4D] border-b-2 border-[#0073EA]" : "text-[#505258]"}`}
          >
            Send Bulk Invitation
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "select" ? (
            <div className="p-4 h-full flex flex-col">
              {/* Search + Filter */}
              <div className="flex items-center gap-2 border border-[#C3C6D4] rounded px-3 py-2 mb-4">
                <Search className="w-4 h-4 text-[#676879]" />
                <Input
                  placeholder="Search email address, name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 p-0 text-sm focus-visible:ring-0"
                />
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#505258] text-sm"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    Filter
                  </Button>
                  <DepartmentFilterDropdown
                    isOpen={showFilterDropdown}
                    onClose={() => setShowFilterDropdown(false)}
                    selectedDepartments={selectedDepartments}
                    onDepartmentChange={setSelectedDepartments}
                    departments={DEPARTMENTS}
                  />
                </div>
              </div>

              {/* Stats + Select All */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[#676879]">
                  {filteredEmployees.length} Employees found
                </span>
                <div className="flex items-center gap-2">
                  <Checkbox checked={selectAll} onCheckedChange={() => handleSelectAll()} />
                  <span className="text-sm text-[#505258]">Select All</span>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  {filteredEmployees
                    .filter((_, i) => i % 2 === 0)
                    .map((employee) => (
                      <div
                        key={employee.id}
                        onClick={() => handleSelectEmployee(employee.id)}
                        className={`p-2 rounded cursor-pointer flex items-center gap-2 ${employee.selected ? "bg-[#E6F1FD]" : "bg-white hover:bg-gray-50"}`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-[#505258] border border-white"
                          style={{ backgroundColor: employee.avatarColor }}
                        >
                          {employee.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#323238] truncate">{employee.name}</div>
                          <div className="text-xs text-[#505258] truncate">{employee.email}</div>
                        </div>
                        {employee.selected && (
                          <div className="w-5 h-5 rounded-full bg-[#0073EA] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                </div>

                <div className="space-y-2">
                  {filteredEmployees
                    .filter((_, i) => i % 2 === 1)
                    .map((employee) => (
                      <div
                        key={employee.id}
                        onClick={() => handleSelectEmployee(employee.id)}
                        className={`p-2 rounded cursor-pointer flex items-center gap-2 ${employee.selected ? "bg-[#E6F1FD]" : "bg-white hover:bg-gray-50"}`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-[#505258] border border-white"
                          style={{ backgroundColor: employee.avatarColor }}
                        >
                          {employee.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#323238] truncate">{employee.name}</div>
                          <div className="text-xs text-[#505258] truncate">{employee.email}</div>
                        </div>
                        {employee.selected && (
                          <div className="w-5 h-5 rounded-full bg-[#0073EA] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            // Bulk Invitation tab (UI only)
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div></div>
                <Button variant="outline"  onClick={handleDownloadSample} className="text-[#0073EA] border-[#0073EA]">
                  <Download className="w-4 h-4 mr-2" />
                  Download sample format
                </Button>
              </div>

              <div className="border-2 border-dashed border-[#C3C6D4] rounded-lg p-8 text-center mb-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-[#F6F7FB] flex items-center justify-center">
                    <Upload className="w-6 h-6 text-[#676879]" />
                  </div>
                  <div className="text-sm text-[#323238]">
                    Drag & Drop File Here or{" "}
                    <label className="text-[#0073EA] cursor-pointer hover:underline">
                      Choose File
                      <input
                        type="file"
                        className="hidden"
                        accept=".csv,.xls,.xlsx"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-[#505258] mb-4">
                <span>Supported Formats: CSV (≤10MB), XLS (≤5MB), XLSX (≤10MB)</span>
                <span>Max: CSV 10MB · XLS 5MB · XLSX 10MB</span>
              </div>

              {uploadedFile && (
                <div className="bg-[#F6F7FB] rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 border border-[#D0D4E4] rounded bg-white flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 16 16" className="text-[#258750]">
                          <rect width="16" height="16" fill="currentColor" rx="2" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#323238]">{uploadedFile.name}</div>
                        <div className="text-xs text-[#505258]">Size {Math.round(uploadedFile.size / 1024)}KB</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (uploadIntervalRef.current) {
                          clearInterval(uploadIntervalRef.current);
                          uploadIntervalRef.current = null;
                        }
                        setUploadedFile(null);
                        setUploadProgress(0);
                      }}
                      className="w-7 h-7 rounded-full bg-[#F6F7FB] flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-[#676879]" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#505258]">Pending</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#505258]">{uploadProgress}%</span>
                      {uploadProgress === 100 && (
                        <div className="w-5 h-5 rounded-full bg-[#258750] flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-white rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-[#D0D4E4]">
          <span className="text-sm text-[#676879]">
            You've selected {selectedCount} employee{selectedCount !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              className="bg-[#0073EA] hover:bg-[#0073EA]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSendInvite}
              disabled={sendDisabled}
            >
              {sending ? "Sending…" : loadingVersion ? "Loading version…" : "Send Invite"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
