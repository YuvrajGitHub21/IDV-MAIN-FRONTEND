import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  useTemplates,
  useUsers,
  formatDate,
  getStatusInfo,
} from "@/hooks/useTemplates";
import { AddNewTemplateDropdown } from "@/components/arcon/AddNewTemplateDropdown";
import { TemplateActionsDropdown } from "@/components/arcon/TemplateActionsDropdown";
import { InviteesAvatarGroup } from "@/components/arcon/InviteesAvatarGroup";
import TemplateFilterDropdown from "@/components/arcon/TemplateFilterDropdown";

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterIsActive, setFilterIsActive] = useState<boolean | undefined>(undefined);
  const [filterCreatedBy, setFilterCreatedBy] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  // Use custom hooks for API integration
  const {
    templates,
    loading: templatesLoading,
    error: templatesError,
    totalItems,
    fetchTemplates,
  } = useTemplates();
  const { users, fetchMultipleUsers } = useUsers();

  useEffect(() => {
    fetchTemplates({ search: searchQuery, page: currentPage, pageSize });
  }, [searchQuery, currentPage, pageSize, fetchTemplates]);

  // Fetch user data for all unique creators when templates change
  useEffect(() => {
    if (templates.length > 0) {
      const uniqueUserIds = [
        ...new Set(templates.map((template) => template.createdBy)),
      ];
      fetchMultipleUsers(uniqueUserIds);
    }
  }, [templates, fetchMultipleUsers]);

  // Enhanced click outside functionality for mobile sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 1024 // Only on mobile/tablet
      ) {
        setSidebarOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when sidebar is open on mobile
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  const getStatusBadge = (isActive: boolean) => {
    const { label, className } = getStatusInfo(isActive);
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
          className,
        )}
      >
        {label}
      </span>
    );
  };

  // Handle template actions
  const handleCreateNewTemplate = (templateName: string) => {
    console.log("Create new template with name:", templateName);
    // Add your create new template logic here
    // For example: navigate to template builder with the template name
  };

  const handleChooseTemplate = () => {
    console.log("Choose template");
    // Add your choose template logic here
  };

  const handleTemplateAction = (action: string, templateId: string) => {
    console.log(`Action: ${action} for template: ${templateId}`);

    switch (action) {
      case "preview":
        navigate(`/preview/${templateId}`);
        break;
      case "edit":
        navigate("/template-builder", { state: { templateId } });
        break;
      default:
        // Add your other template action logic here
        console.log(`Action ${action} not yet implemented`);
    }
  };

  const handleLogout = () => {
    // Clear authentication tokens and user data from localStorage
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");

    // Navigate to login page
    navigate("/login", { replace: true });
  };

  const goToNotFound = () => navigate("/not-found", { replace: true });
  const home_page = () => navigate("/home", { replace: true });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-3 md:px-4 h-11 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/4566b1e4f2b69299156b1f1c61472e06e0ad9666?width=180"
            alt="Arcon Logo"
            className="h-7 w-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-white text-xs font-medium">OS</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-18 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0",
          )}
        >
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="relative flex flex-col h-full pt-2 pb-4 z-50">
            <nav className="flex-1 px-0 space-y-1">
              {/* Home */}
              <div
                className="flex flex-col items-center py-2 text-gray-600 hover:bg-gray-50 cursor-pointer"
                onClick={home_page}
              >
                <svg
                  className="w-5 h-5"
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.9004 2.53385C11.5784 2.28337 11.4174 2.15813 11.2396 2.10998C11.0827 2.06751 10.9173 2.06751 10.7604 2.10998C10.5826 2.15813 10.4216 2.28337 10.0996 2.53385L3.88244 7.36938C3.46685 7.69262 3.25906 7.85423 3.10936 8.05664C2.97675 8.23592 2.87797 8.4379 2.81786 8.65265C2.75 8.89508 2.75 9.15832 2.75 9.68481V16.3168C2.75 17.3436 2.75 17.857 2.94982 18.2492C3.12559 18.5941 3.40605 18.8746 3.75102 19.0503C4.14319 19.2502 4.65657 19.2502 5.68333 19.2502H7.51667C7.77336 19.2502 7.9017 19.2502 7.99975 19.2002C8.08599 19.1563 8.1561 19.0862 8.20004 18.9999C8.25 18.9019 8.25 18.7735 8.25 18.5168V12.4668C8.25 11.9535 8.25 11.6968 8.34991 11.5007C8.43779 11.3282 8.57803 11.188 8.75051 11.1001C8.94659 11.0002 9.20329 11.0002 9.71667 11.0002H12.2833C12.7967 11.0002 13.0534 11.0002 13.2495 11.1001C13.422 11.188 13.5622 11.3282 13.6501 11.5007C13.75 11.6968 13.75 11.9535 13.75 12.4668V18.5168C13.75 18.7735 13.75 18.9019 13.8 18.9999C13.8439 19.0862 13.914 19.1563 14.0003 19.2002C14.0983 19.2502 14.2266 19.2502 14.4833 19.2502H16.3167C17.3434 19.2502 17.8568 19.2502 18.249 19.0503C18.5939 18.8746 18.8744 18.5941 19.0502 18.2492C19.25 17.857 19.25 17.3436 19.25 16.3168V9.68481C19.25 9.15832 19.25 8.89508 19.1821 8.65265C19.122 8.4379 19.0232 8.23592 18.8906 8.05664C18.7409 7.85423 18.5331 7.69262 18.1176 7.36938L11.9004 2.53385Z"
                    stroke="#515257"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs font-semibold mt-1">Home</span>
              </div>

              {/* Templates - Active */}
              <div className="relative">
                <div className="flex flex-col items-center py-2 text-blue-600 bg-blue-50 cursor-pointer">
                  <svg
                    className="w-5 h-5"
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M11.9167 1.84892C11.9167 1.82481 11.9167 1.81275 11.9157 1.79088C11.894 1.33826 11.4959 0.940409 11.0434 0.918996C11.0215 0.917962 11.0143 0.917965 11 0.917969H8.02877C7.29091 0.91796 6.6819 0.917952 6.18583 0.958486C5.67057 1.00058 5.19693 1.09094 4.75204 1.31762C4.06211 1.66915 3.50118 2.23008 3.14965 2.92001C2.92297 3.3649 2.83261 3.83854 2.79052 4.3538C2.74998 4.84988 2.74999 5.45888 2.75 6.19675V15.8058C2.74999 16.5437 2.74998 17.1527 2.79052 17.6488C2.83261 18.164 2.92297 18.6377 3.14965 19.0826C3.50118 19.7725 4.06211 20.3334 4.75204 20.685C5.19693 20.9117 5.67057 21.002 6.18583 21.0441C6.68192 21.0846 7.29091 21.0846 8.02879 21.0846H13.9712C14.7091 21.0846 15.3181 21.0846 15.8142 21.0441C16.3294 21.002 16.8031 20.9117 17.248 20.685C17.9379 20.3334 18.4988 19.7725 18.8503 19.0826C19.077 18.6377 19.1674 18.164 19.2095 17.6488C19.25 17.1527 19.25 16.5437 19.25 15.8058V9.16791C19.25 9.15368 19.25 9.14656 19.249 9.12472C19.2276 8.67204 18.8297 8.27395 18.3771 8.25236C18.3552 8.25131 18.3431 8.25131 18.3191 8.25131H14.2708C14.0394 8.25134 13.8141 8.25137 13.6233 8.23578C13.4138 8.21866 13.1665 8.17826 12.9177 8.05149C12.5727 7.87573 12.2922 7.59526 12.1165 7.25029C11.9897 7.00149 11.9493 6.75423 11.9323 6.54469C11.9166 6.35388 11.9167 6.12857 11.9167 5.89722V1.84892ZM7.33333 11.918C6.82708 11.918 6.41667 12.3284 6.41667 12.8346C6.41667 13.3409 6.82708 13.7513 7.33333 13.7513H14.6667C15.1729 13.7513 15.5833 13.3409 15.5833 12.8346C15.5833 12.3284 15.1729 11.918 14.6667 11.918H7.33333ZM7.33333 15.5846C6.82708 15.5846 6.41667 15.995 6.41667 16.5013C6.41667 17.0076 6.82708 17.418 7.33333 17.418H12.8333C13.3396 17.418 13.75 17.0076 13.75 16.5013C13.75 15.995 13.3396 15.5846 12.8333 15.5846H7.33333Z"
                      fill="#0073EA"
                    />
                    <path
                      d="M17.3323 6.41818C17.6015 6.41819 17.736 6.41819 17.8462 6.35061C18.002 6.25516 18.095 6.0303 18.0524 5.85273C18.0221 5.72701 17.9344 5.63933 17.7589 5.46398L14.7043 2.40935C14.5289 2.23382 14.4412 2.14606 14.3155 2.11584C14.1379 2.07316 13.9131 2.16623 13.8176 2.32192C13.75 2.43217 13.75 2.56674 13.75 2.8359V5.68482C13.75 5.94151 13.75 6.06985 13.8 6.16789C13.8439 6.25413 13.914 6.32424 14.0002 6.36819C14.0983 6.41815 14.2267 6.41815 14.4833 6.41815L17.3323 6.41818Z"
                      fill="#0073EA"
                    />
                  </svg>
                  <span className="text-xs font-semibold mt-1 text-gray-800">
                    Template
                  </span>
                </div>
                <div className="absolute left-0 top-2 w-0.5 h-12 bg-blue-600 rounded-r"></div>
              </div>

              {/* Verification */}
              <div className="flex flex-col items-center py-2 text-gray-600 hover:bg-gray-50 cursor-pointer">
                <svg
                  className="w-5 h-5"
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20.1654 9.16536H1.83203M10.082 12.832H5.4987M1.83203 7.51536V14.482C1.83203 15.5088 1.83203 16.0222 2.03186 16.4144C2.20762 16.7593 2.48808 17.0398 2.83305 17.2155C3.22522 17.4154 3.7386 17.4154 4.76536 17.4154H17.232C18.2588 17.4154 18.7722 17.4154 19.1644 17.2155C19.5093 17.0398 19.7898 16.7593 19.9655 16.4144C20.1654 16.0222 20.1654 15.5088 20.1654 14.482V7.51536C20.1654 6.48861 20.1654 5.97522 19.9655 5.58305C19.7898 5.23809 19.5093 4.95763 19.1644 4.78186C18.7722 4.58203 18.2588 4.58203 17.232 4.58203H4.76536C3.73861 4.58203 3.22522 4.58203 2.83305 4.78186C2.48809 4.95762 2.20762 5.23808 2.03186 5.58305C1.83203 5.97522 1.83203 6.4886 1.83203 7.51536Z"
                    stroke="#676879"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs font-semibold mt-1">Verification</span>
              </div>

              {/* Integration */}
              <div
                className="flex flex-col items-center py-2 text-gray-600 hover:bg-gray-50 cursor-pointer"
                onClick={goToNotFound}
              >
                <svg
                  className="w-5 h-5"
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.5833 18.332H15.4C13.8598 18.332 13.0898 18.332 12.5015 18.0323C11.984 17.7686 11.5634 17.348 11.2998 16.8305C11 16.2422 11 15.4722 11 13.932V8.06536C11 6.52522 11 5.75514 11.2998 5.16689C11.5634 4.64944 11.984 4.22875 12.5015 3.9651C13.0898 3.66536 13.8598 3.66536 15.4 3.66536H15.5833M15.5833 18.332C15.5833 19.3446 16.4041 20.1654 17.4167 20.1654C18.4292 20.1654 19.25 19.3446 19.25 18.332C19.25 17.3195 18.4292 16.4987 17.4167 16.4987C16.4041 16.4987 15.5833 17.3195 15.5833 18.332ZM15.5833 3.66536C15.5833 4.67789 16.4041 5.4987 17.4167 5.4987C18.4292 5.4987 19.25 4.67789 19.25 3.66536C19.25 2.65284 18.4292 1.83203 17.4167 1.83203C16.4041 1.83203 15.5833 2.65284 15.5833 3.66536ZM6.41667 10.9987H15.5833M6.41667 10.9987C6.41667 12.0112 5.59586 12.832 4.58333 12.832C3.57081 12.832 2.75 12.0112 2.75 10.9987C2.75 9.98615 3.57081 9.16536 4.58333 9.16536C5.59586 9.16536 6.41667 9.98615 6.41667 10.9987ZM15.5833 10.9987C15.5833 12.0112 16.4041 12.832 17.4167 12.832C18.4292 12.832 19.25 12.0112 19.25 10.9987C19.25 9.98615 18.4292 9.16536 17.4167 9.16536C16.4041 9.16536 15.5833 9.98615 15.5833 10.9987Z"
                    stroke="#676879"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs font-semibold mt-1">Integration</span>
              </div>

              {/* Analytics */}
              <div
                className="flex flex-col items-center py-2 text-gray-600 hover:bg-gray-50 cursor-pointer"
                onClick={goToNotFound}
              >
                <svg
                  className="w-5 h-5"
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.25 6.41667H4.21667C3.70329 6.41667 3.44659 6.41667 3.25051 6.51657C3.07803 6.60446 2.9378 6.7447 2.84991 6.91718C2.75 7.11326 2.75 7.36995 2.75 7.88333V17.7833C2.75 18.2968 2.75 18.5534 2.84991 18.7495C2.9378 18.922 3.07803 19.0622 3.25051 19.1501C3.44659 19.25 3.70329 19.25 4.21667 19.25H8.25M8.25 19.25H13.75M8.25 19.25V4.21667C8.25 3.70329 8.25 3.44659 8.34991 3.25051C8.4378 3.07803 8.57803 2.9378 8.75051 2.84991C8.94659 2.75 9.20324 2.75 9.71667 2.75H12.2833C12.7968 2.75 13.0534 2.75 13.2495 2.84991C13.422 2.9378 13.5622 3.07803 13.6501 3.25051C13.75 3.44659 13.75 3.70329 13.75 4.21667V19.25M13.75 19.25H17.7833C18.2968 19.25 18.5534 19.25 18.7495 19.1501C18.922 19.0622 19.0622 18.922 19.1501 18.7495C19.25 18.5534 19.25 18.2968 19.25 17.7833V11.55C19.25 11.0366 19.25 10.7799 19.1501 10.5838C19.0622 10.4113 18.922 10.2712 18.7495 10.1833C18.5534 10.0833 18.2968 10.0833 17.7833 10.0833H13.75"
                    stroke="#676879"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs font-semibold mt-1">Analytics</span>
              </div>

              {/* Roles */}
              <div
                className="flex flex-col items-center py-2 text-gray-600 hover:bg-gray-50 cursor-pointer"
                onClick={goToNotFound}
              >
                <svg
                  className="w-5 h-5"
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.3576 19.8203C10.5605 19.9387 10.662 19.9979 10.8052 20.0286C10.9164 20.0525 11.0784 20.0525 11.1896 20.0286C11.3328 19.9979 11.4343 19.9387 11.6372 19.8203C13.4229 18.7786 18.3307 15.5061 18.3307 11.0067V6.62281C18.3307 5.88993 18.3307 5.52348 18.2108 5.20849C18.105 4.93022 17.9329 4.68194 17.7095 4.48508C17.4567 4.26225 17.1136 4.13359 16.4274 3.87625L11.5124 2.03313C11.3218 1.96166 11.2266 1.92593 11.1285 1.91177C11.0416 1.8992 10.9532 1.8992 10.8663 1.91177C10.7682 1.92593 10.673 1.96166 10.4824 2.03313L5.56743 3.87625C4.88121 4.13359 4.5381 4.26225 4.28525 4.48508C4.06188 4.68194 3.88981 4.93022 3.78393 5.20849C3.66406 5.52348 3.66406 5.88993 3.66406 6.62281V11.0067C3.66406 15.5061 8.57186 18.7786 10.3576 19.8203Z"
                    stroke="#515257"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs font-semibold mt-1">Roles</span>
              </div>

              {/* Users */}
              <div
                className="flex flex-col items-center py-2 text-gray-600 hover:bg-gray-50 cursor-pointer"
                onClick={goToNotFound}
              >
                <div className="w-5 h-5 relative">
                  <svg
                    className="absolute inset-0"
                    width="14"
                    height="18"
                    viewBox="0 0 14 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.16536 12.2083H5.8737C4.59443 12.2083 3.95479 12.2083 3.43432 12.3662C2.26244 12.7217 1.3454 13.6388 0.989918 14.8107C0.832031 15.3311 0.832031 15.9707 0.832031 17.25M12.2904 4.875C12.2904 7.15317 10.4436 9 8.16536 9C5.88719 9 4.04036 7.15317 4.04036 4.875C4.04036 2.59683 5.88719 0.75 8.16536 0.75C10.4436 0.75 12.2904 2.59683 12.2904 4.875Z"
                      stroke="#515257"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <svg
                    className="absolute bottom-0 right-0"
                    width="13"
                    height="13"
                    viewBox="0 0 13 13"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.91687 8.80809C8.68089 8.80854 9.30067 8.20937 9.30114 7.46974C9.30162 6.73011 8.6826 6.13019 7.91858 6.12973C7.15452 6.12928 6.53477 6.72846 6.5343 7.46808C6.53383 8.20771 7.15281 8.80763 7.91687 8.80809Z"
                      stroke="#515257"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6.66553 10.7561L6.93466 11.343C7.01469 11.5177 7.14533 11.6662 7.31076 11.7704C7.47625 11.8747 7.66938 11.9302 7.8668 11.9303C8.06426 11.9305 8.25746 11.8752 8.42303 11.7711C8.58865 11.6671 8.71948 11.5187 8.79974 11.3441L9.0696 10.7575C9.1657 10.5494 9.32716 10.3759 9.53106 10.2618C9.73625 10.1474 9.97353 10.0987 10.209 10.1228L10.8684 10.1912C11.0647 10.2114 11.2628 10.1761 11.4388 10.0894C11.6147 10.0028 11.7609 9.86866 11.8597 9.70324C11.9585 9.53787 12.0057 9.34831 11.9954 9.15752C11.9852 8.96673 11.918 8.78291 11.8019 8.62839L11.4119 8.10882C11.2729 7.92246 11.1988 7.69819 11.2001 7.46839C11.2002 7.23921 11.2754 7.01597 11.4147 6.83067L11.8055 6.3116C11.9217 6.15721 11.9892 5.97348 11.9997 5.78269C12.0102 5.59192 11.9632 5.40229 11.8645 5.23682C11.766 5.07125 11.62 4.93692 11.4441 4.8501C11.2683 4.76328 11.0702 4.7277 10.874 4.74768L10.2145 4.81524C9.97897 4.83903 9.7417 4.79011 9.5367 4.67546C9.33253 4.56047 9.1712 4.38589 9.07588 4.17671L8.80469 3.58979C8.72465 3.41508 8.59402 3.2666 8.42853 3.16235C8.2631 3.05809 8.06996 3.00256 7.8725 3.00247C7.67509 3.00232 7.48188 3.05763 7.31626 3.16168C7.15069 3.26573 7.01987 3.41406 6.93962 3.58867L6.66973 4.17527C6.57411 4.38433 6.41257 4.55873 6.20827 4.67347C6.00309 4.78787 5.76578 4.83651 5.53031 4.81243L4.86887 4.74409C4.67259 4.72387 4.47447 4.75921 4.29852 4.84582C4.12258 4.93243 3.97637 5.06659 3.87762 5.23204C3.77875 5.39739 3.73157 5.58696 3.74182 5.77775C3.75207 5.96855 3.81929 6.15236 3.93535 6.30689L4.32544 6.82642C4.46456 7.01189 4.5394 7.23522 4.53921 7.4644C4.53911 7.69358 4.46398 7.91686 4.32463 8.10212L3.93387 8.62118C3.81762 8.77556 3.75016 8.9593 3.73967 9.15008C3.72918 9.34086 3.77611 9.53052 3.87477 9.69596C3.9734 9.86146 4.11946 9.99573 4.29527 10.0825C4.47108 10.1693 4.66911 10.205 4.8654 10.1851L5.52487 10.1175C5.76038 10.0938 5.99762 10.1427 6.20266 10.2573C6.40757 10.372 6.56964 10.5466 6.66553 10.7561Z"
                      stroke="#515257"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold mt-1">Users</span>
              </div>
            </nav>

            {/* Logout */}
            <div
              className="flex flex-col items-center py-2 text-gray-600 hover:bg-gray-50 cursor-pointer"
              onClick={handleLogout}
            >
              <svg
                className="w-5 h-5"
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.25 19.25H4.58333C4.17935 19.25 3.79185 19.0893 3.50429 18.8017C3.21673 18.5141 3.05556 18.1267 3.05556 17.7222V4.27778C3.05556 3.87326 3.21673 3.48587 3.50429 3.19831C3.79185 2.91075 4.17935 2.75 4.58333 2.75H8.25M15.5833 15.5833L19.25 11.9167M19.25 11.9167L15.5833 8.25M19.25 11.9167H8.25"
                  stroke="#676879"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs font-semibold mt-1">Logout</span>
            </div>

            {/* Help */}
            <div className="flex flex-col items-center py-2 text-gray-600 hover:bg-gray-50 cursor-pointer">
              <svg
                className="w-5 h-5"
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.3312 8.2487C8.54671 7.63606 8.97209 7.11947 9.53203 6.7904C10.0919 6.46134 10.7502 6.34106 11.3903 6.45085C12.0304 6.56065 12.6109 6.89342 13.0292 7.39027C13.4474 7.8871 13.6764 8.51592 13.6754 9.16536C13.6754 10.9987 10.9254 11.9154 10.9254 11.9154M10.9987 15.582H11.0079M20.1654 10.9987C20.1654 16.0613 16.0613 20.1654 10.9987 20.1654C5.93609 20.1654 1.83203 16.0613 1.83203 10.9987C1.83203 5.93609 5.93609 1.83203 10.9987 1.83203C16.0613 1.83203 20.1654 5.93609 20.1654 10.9987Z"
                  stroke="#676879"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs font-semibold mt-1">Help</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Sub Header */}
          <div className="border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between px-4 py-2">
              <h1 className="text-xl font-bold text-gray-800">Templates</h1>
              <div className="flex items-center gap-3">
                {/* Filter Button */}
                <button className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Filter</span>
                </button>

                {/* Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-1.5 w-48 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Add New Button */}
                <AddNewTemplateDropdown
                  onCreateNew={handleCreateNewTemplate}
                  onChooseTemplate={handleChooseTemplate}
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="p-4">
            {/* Error State */}
            {templatesError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error loading templates
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {templatesError}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Invitees
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {templatesLoading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-sm text-gray-600">
                              Loading templates...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : templates.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No templates found
                        </td>
                      </tr>
                    ) : (
                      templates.map((template) => (
                        <tr key={template.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 text-sm text-gray-900">
                            {template.name}
                          </td>
                          <td className="px-2 py-2 text-sm text-gray-900">
                            <InviteesAvatarGroup />
                          </td>
                          <td className="px-2 py-2 text-sm text-gray-900">
                            {formatDate(template.createdAtUtc)}
                          </td>
                          <td className="px-2 py-2 text-sm text-gray-900">
                            {users[template.createdBy] || "Unknown User"}
                          </td>
                          <td className="px-2 py-2 text-sm">
                            {getStatusBadge(template.isActive)}
                          </td>
                          <td className="px-2 py-2 text-sm text-gray-900">
                            {formatDate(template.createdAtUtc)}
                          </td>
                          <td className="px-2 py-2 text-sm text-gray-900">
                            <TemplateActionsDropdown
                              onPreview={() =>
                                handleTemplateAction("preview", template.id)
                              }
                              onSendInvite={() =>
                                handleTemplateAction("sendInvite", template.id)
                              }
                              onGenerateLink={() =>
                                handleTemplateAction(
                                  "generateLink",
                                  template.id,
                                )
                              }
                              onDownload={() =>
                                handleTemplateAction("download", template.id)
                              }
                              onRename={() =>
                                handleTemplateAction("rename", template.id)
                              }
                              onClone={() =>
                                handleTemplateAction("clone", template.id)
                              }
                              onEdit={() =>
                                handleTemplateAction("edit", template.id)
                              }
                              onDelete={() =>
                                handleTemplateAction("delete", template.id)
                              }
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3 p-3">
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">
                      Loading templates...
                    </span>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500">
                    No templates found
                  </div>
                ) : (
                  templates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Created by{" "}
                            {users[template.createdBy] || "Unknown User"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(template.createdAtUtc)}
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <InviteesAvatarGroup />
                            {getStatusBadge(template.isActive)}
                          </div>
                        </div>
                        <TemplateActionsDropdown
                          onPreview={() =>
                            handleTemplateAction("preview", template.id)
                          }
                          onSendInvite={() =>
                            handleTemplateAction("sendInvite", template.id)
                          }
                          onGenerateLink={() =>
                            handleTemplateAction("generateLink", template.id)
                          }
                          onDownload={() =>
                            handleTemplateAction("download", template.id)
                          }
                          onRename={() =>
                            handleTemplateAction("rename", template.id)
                          }
                          onClone={() =>
                            handleTemplateAction("clone", template.id)
                          }
                          onEdit={() =>
                            handleTemplateAction("edit", template.id)
                          }
                          onDelete={() =>
                            handleTemplateAction("delete", template.id)
                          }
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <span>
                1-{Math.min(pageSize, totalItems)} of {totalItems}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage * pageSize >= totalItems}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                  </svg>
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.ceil(totalItems / pageSize))
                  }
                  disabled={currentPage * pageSize >= totalItems}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6v12h2V6h-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-gray-200 bg-white p-4">
            <div className="text-center text-xs text-gray-600">
              Copyright @ 2025{" "}
              <span className="font-medium text-gray-800">Arcon</span>. All
              right reserved.
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
