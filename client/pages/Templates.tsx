import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Types for API responses
interface TemplateItem {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  templateRules: string;
  isActive: boolean;
  createdAtUtc: string;
}

interface TemplatesResponse {
  page: number;
  pageSize: number;
  total: number;
  items: TemplateItem[];
}

interface UserResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
  };
  errors: string[];
}

// Mock data based on Figma design
const mockTemplates: TemplateItem[] = [
  {
    id: "1",
    name: "Template Name",
    description: "Template description",
    createdBy: "user1",
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-07-14T00:00:00Z"
  },
  {
    id: "2",
    name: "New Template",
    description: "New template description",
    createdBy: "user2",
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-06-22T00:00:00Z"
  },
  {
    id: "3",
    name: "Template_Newname",
    description: "Template description",
    createdBy: "user3",
    templateRules: "Rules",
    isActive: false,
    createdAtUtc: "2024-06-18T00:00:00Z"
  },
  {
    id: "4",
    name: "Template Name 8",
    description: "Template description",
    createdBy: "user4",
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-05-04T00:00:00Z"
  },
  {
    id: "5",
    name: "Template Name 2",
    description: "Template description",
    createdBy: "user5",
    templateRules: "Rules",
    isActive: true,
    createdAtUtc: "2024-07-14T00:00:00Z"
  }
];

const mockUsers: Record<string, string> = {
  user1: "Patricia A. Ramirez",
  user2: "Deloris L. Hall",
  user3: "Carl H. Smith",
  user4: "Ryan M. Johnson",
  user5: "Fannie W. Johnson"
};

export default function Templates() {
  const [templates, setTemplates] = useState<TemplateItem[]>(mockTemplates);
  const [users, setUsers] = useState<Record<string, string>>(mockUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalItems, setTotalItems] = useState(mockTemplates.length);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // API integration functions (currently using mock data)
  const fetchTemplates = async (params: {
    isActive?: boolean;
    createdBy?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`http://localhost:5294/api/form-templates?${new URLSearchParams(params)}`);
      // const data: TemplatesResponse = await response.json();
      
      // For now, filter mock data based on search
      let filteredTemplates = mockTemplates;
      if (params.search) {
        filteredTemplates = mockTemplates.filter(template =>
          template.name.toLowerCase().includes(params.search!.toLowerCase())
        );
      }
      
      setTemplates(filteredTemplates);
      setTotalItems(filteredTemplates.length);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUser = async (userId: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`http://localhost:5294/api/User/${userId}`);
      // const data: UserResponse = await response.json();
      // return `${data.data.firstName} ${data.data.lastName}`;
      
      return mockUsers[userId] || "Unknown User";
    } catch (error) {
      console.error("Error fetching user:", error);
      return "Unknown User";
    }
  };

  useEffect(() => {
    fetchTemplates({ search: searchQuery, page: currentPage, pageSize });
  }, [searchQuery, currentPage, pageSize]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
          Completed
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
          In Progress
        </span>
      );
    }
  };

  const getInviteesAvatars = () => {
    const avatarColors = [
      "bg-pink-200",
      "bg-blue-200",
      "bg-purple-200",
      "bg-orange-200",
      "bg-teal-200",
      "bg-yellow-200"
    ];
    
    return (
      <div className="flex -space-x-1">
        <div className={cn("w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium", avatarColors[0])}>
          OP
        </div>
        <div className={cn("w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium", avatarColors[1])}>
          VS
        </div>
        <div className={cn("w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium", avatarColors[2])}>
          +{Math.floor(Math.random() * 8) + 1}
        </div>
      </div>
    );
  };

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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-18 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 lg:hidden" 
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          <div className="relative flex flex-col h-full pt-2 pb-4">
            <nav className="flex-1 px-0 space-y-1">
              {/* Home */}
              <div className="flex flex-col items-center py-2 text-gray-600 hover:bg-gray-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-xs font-semibold mt-1">Home</span>
              </div>

              {/* Templates - Active */}
              <div className="relative">
                <div className="flex flex-col items-center py-2 text-blue-600 bg-blue-50">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M14 2a2 2 0 00-2-2H8a2 2 0 00-2 2v5.5L3.5 10A1.5 1.5 0 002 11.5v9A1.5 1.5 0 003.5 22h13a1.5 1.5 0 001.5-1.5V8a2 2 0 00-2-2h-2V2zM8 2v4h4V2H8zm8 6v12H4v-9h12z" />
                  </svg>
                  <span className="text-xs font-semibold mt-1 text-gray-800">Template</span>
                </div>
                <div className="absolute left-0 top-2 w-0.5 h-12 bg-blue-600 rounded-r"></div>
              </div>

              {/* Other nav items */}
              {["Verification", "Integration", "Analytics", "Roles", "Users"].map((item) => (
                <div key={item} className="flex flex-col items-center py-2 text-gray-600 hover:bg-gray-50">
                  <div className="w-5 h-5 bg-gray-400 rounded"></div>
                  <span className="text-xs font-semibold mt-1">{item}</span>
                </div>
              ))}
            </nav>

            {/* Help */}
            <div className="flex flex-col items-center py-2 text-gray-600 hover:bg-gray-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                  </svg>
                  <span className="hidden sm:inline">Filter</span>
                </button>

                {/* Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                <div className="flex">
                  <button className="bg-blue-600 text-white px-3 py-1.5 text-sm font-medium rounded-l hover:bg-blue-700">
                    Add New
                  </button>
                  <button className="bg-blue-600 border-l border-blue-500 text-white px-2 py-1.5 rounded-r hover:bg-blue-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="p-4">
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Invitees</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Created Date</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Created By</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Last Updated</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {templates.map((template) => (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2 text-sm text-gray-900">{template.name}</td>
                        <td className="px-2 py-2 text-sm text-gray-900">{getInviteesAvatars()}</td>
                        <td className="px-2 py-2 text-sm text-gray-900">{formatDate(template.createdAtUtc)}</td>
                        <td className="px-2 py-2 text-sm text-gray-900">{users[template.createdBy] || "Unknown User"}</td>
                        <td className="px-2 py-2 text-sm">{getStatusBadge(template.isActive)}</td>
                        <td className="px-2 py-2 text-sm text-gray-900">{formatDate(template.createdAtUtc)}</td>
                        <td className="px-2 py-2 text-sm text-gray-900">
                          <button className="p-1 rounded-full hover:bg-gray-100">
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3 p-3">
                {templates.map((template) => (
                  <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Created by {users[template.createdBy] || "Unknown User"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(template.createdAtUtc)}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          {getInviteesAvatars()}
                          {getStatusBadge(template.isActive)}
                        </div>
                      </div>
                      <button className="p-1 rounded-full hover:bg-gray-100">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
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
              
              <span>1-{Math.min(pageSize, totalItems)} of {totalItems}</span>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z" />
                  </svg>
                </button>
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                  </svg>
                </button>
                <button 
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage * pageSize >= totalItems}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                  </svg>
                </button>
                <button 
                  onClick={() => setCurrentPage(Math.ceil(totalItems / pageSize))}
                  disabled={currentPage * pageSize >= totalItems}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6v12h2V6h-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-gray-200 bg-white p-4">
            <div className="text-center text-xs text-gray-600">
              Copyright @ 2025 <span className="font-medium text-gray-800">Arcon</span>. All right reserved.
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
