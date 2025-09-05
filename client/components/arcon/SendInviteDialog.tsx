import React, { useEffect, useState, useRef } from "react";
import { X, Search, Filter, Download, Upload, Check, CheckCircle } from "lucide-react";
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

interface SendInviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
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
  {
    id: "1",
    name: "Roger G. Rhone",
    email: "RogerGRhone@teleworm.us",
    initials: "OP",
    avatarColor: "#F4DEE4",
    department: "Operations",
    selected: true,
  },
  {
    id: "2",
    name: "Mike J. Torres",
    email: "MikeJTorres@rhyta.com",
    initials: "MT",
    avatarColor: "#D6ECF5",
    department: "IT & Security",
    selected: false,
  },
  {
    id: "3",
    name: "Wanda C. Moore",
    email: "WandaCMoore@dayrep.com",
    initials: "WM",
    avatarColor: "#E0DAEE",
    department: "Marketing",
    selected: false,
  },
  {
    id: "4",
    name: "Roy C. Kephart",
    email: "RoyCKephart@dayrep.com",
    initials: "RK",
    avatarColor: "#FFE6DE",
    department: "Sales",
    selected: true,
  },
  {
    id: "5",
    name: "Lois S. Spencer",
    email: "LoisSSpencer@rhyta.com",
    initials: "LS",
    avatarColor: "#DAE5E6",
    department: "Finance",
    selected: false,
  },
  {
    id: "6",
    name: "Jerry T. Beavers",
    email: "JerryTBeavers@teleworm.us",
    initials: "JB",
    avatarColor: "#F4EBE8",
    department: "Human Resources",
    selected: false,
  },
];

export default function SendInviteDialog({
  isOpen,
  onClose,
}: SendInviteDialogProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"select" | "bulk">("select");
  const [employees, setEmployees] = useState<Employee[]>(SAMPLE_EMPLOYEES);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const controller = new AbortController();

    async function loadInvitees() {
      try {
        const res = await fetch("/api/invitees", { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: { employees: Employee[] } = await res.json();
        if (isMounted && Array.isArray(data.employees)) {
          setEmployees(data.employees);
        }
      } catch (_err) {
        // Keep static fallback if API fails
      }
    }

    loadInvitees();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [isOpen]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadIntervalRef = useRef<number | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Ensure we clear any running interval when component unmounts
  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
        uploadIntervalRef.current = null;
      }
    };
  }, []);

  // Also clear when dialog closes
  useEffect(() => {
    if (!isOpen && uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      selectedDepartments.length === 0 ||
      selectedDepartments.includes(emp.department);
    return matchesSearch && matchesDepartment;
  });

  const selectedCount = employees.filter((emp) => emp.selected).length;

  const handleSelectEmployee = (id: string) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id ? { ...emp, selected: !emp.selected } : emp,
      ),
    );
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setEmployees((prev) =>
      prev.map((emp) => ({ ...emp, selected: newSelectAll })),
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Simulate upload progress
      setUploadProgress(0);

      // Clear any existing interval
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
    }
  };

  const handleSendInvite = () => {
    // Show success toast with custom design
    toast.custom(
      (t) => (
        <div className="flex w-[540px] p-6 justify-center items-center gap-4 rounded-lg bg-white shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]">
          <div className="flex w-12 h-12 p-3 justify-center items-center flex-shrink-0 rounded-[28px] border-[8px] border-[#ECFDF3] bg-[#D1FADF]">
            <CheckCircle className="w-6 h-6 text-[#039855]" />
          </div>
          <div className="flex flex-col items-start gap-7 flex-1">
            <div className="flex flex-col items-start gap-2 self-stretch">
              <div className="self-stretch text-[#323238] font-figtree text-base font-bold leading-[26px]">
                Invite has been sent
              </div>
            </div>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="flex w-8 h-8 justify-center items-center gap-[10px] flex-shrink-0 rounded-[50px] bg-white"
          >
            <X className="w-5 h-5 text-[#676879]" />
          </button>
        </div>
      ),
      {
        duration: 5000,
        position: "top-center",
      }
    );

    // Close dialog
    onClose();

    // Navigate to home page
    navigate("/home");
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-[800px] max-h-[640px] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#D0D4E4]">
          <h2 className="text-lg font-bold text-[#323238] font-figtree">
            Send Invite
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-50"
          >
            <X className="w-5 h-5 text-[#676879]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#D0D4E4] px-5">
          <button
            onClick={() => setActiveTab("select")}
            className={`px-2 py-2 text-sm font-roboto ${
              activeTab === "select"
                ? "text-[#172B4D] border-b-2 border-[#0073EA]"
                : "text-[#505258]"
            }`}
          >
            Select Invitees
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-2 py-2 text-sm font-roboto ml-2 ${
              activeTab === "bulk"
                ? "text-[#172B4D] border-b-2 border-[#0073EA]"
                : "text-[#505258]"
            }`}
          >
            Send Bulk Invitation
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "select" ? (
            <div className="p-4 h-full flex flex-col">
              {/* Search and Filter */}
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

              {/* Stats and Select All */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[#676879]">
                  {filteredEmployees.length} Employees found
                </span>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-[#505258]">Select All</span>
                </div>
              </div>

              {/* Employee List */}
              <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2">
                {/* Left Column */}
                <div className="space-y-2">
                  {filteredEmployees
                    .filter((_, i) => i % 2 === 0)
                    .map((employee) => (
                      <div
                        key={employee.id}
                        onClick={() => handleSelectEmployee(employee.id)}
                        className={`p-2 rounded cursor-pointer flex items-center gap-2 ${
                          employee.selected
                            ? "bg-[#E6F1FD]"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-[#505258] border border-white"
                          style={{ backgroundColor: employee.avatarColor }}
                        >
                          {employee.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#323238] truncate">
                            {employee.name}
                          </div>
                          <div className="text-xs text-[#505258] truncate">
                            {employee.email}
                          </div>
                        </div>
                        {employee.selected && (
                          <div className="w-5 h-5 rounded-full bg-[#0073EA] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                </div>

                {/* Right Column */}
                <div className="space-y-2">
                  {filteredEmployees
                    .filter((_, i) => i % 2 === 1)
                    .map((employee) => (
                      <div
                        key={employee.id}
                        onClick={() => handleSelectEmployee(employee.id)}
                        className={`p-2 rounded cursor-pointer flex items-center gap-2 ${
                          employee.selected
                            ? "bg-[#E6F1FD]"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-[#505258] border border-white"
                          style={{ backgroundColor: employee.avatarColor }}
                        >
                          {employee.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#323238] truncate">
                            {employee.name}
                          </div>
                          <div className="text-xs text-[#505258] truncate">
                            {employee.email}
                          </div>
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
            /* Bulk Invitation Tab */
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div></div>
                <Button
                  variant="outline"
                  className="text-[#0073EA] border-[#0073EA]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download sample format
                </Button>
              </div>

              {/* Upload Area */}
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
                        accept=".xls,.xlsx,.csv"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-[#505258] mb-4">
                <span>Supported Formats: JPG, JPEG, PNG, SVG, .XLS</span>
                <span>Maximum Size: 25MB</span>
              </div>

              {/* File Upload Status */}
              {uploadedFile && (
                <div className="bg-[#F6F7FB] rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 border border-[#D0D4E4] rounded bg-white flex items-center justify-center">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          className="text-[#258750]"
                        >
                          <rect
                            width="16"
                            height="16"
                            fill="currentColor"
                            rx="2"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#323238]">
                          {uploadedFile.name}
                        </div>
                        <div className="text-xs text-[#505258]">
                          Size {Math.round(uploadedFile.size / 1024)}KB
                        </div>
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
                      <span className="text-xs text-[#505258]">
                        {uploadProgress}%
                      </span>
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
            You've selected {selectedCount} employee
            {selectedCount !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-[#0073EA] hover:bg-[#0073EA]/90"
              onClick={handleSendInvite}
            >
              Send Invite
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
