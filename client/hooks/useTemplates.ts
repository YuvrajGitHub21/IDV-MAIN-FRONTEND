import { useState, useEffect, useCallback } from "react";

// Types for API responses
export interface TemplateItem {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  templateRules: string;
  isActive: boolean;
  createdAtUtc: string;
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
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
  };
  errors: string[];
}

export interface TemplateFilters {
  isActive?: boolean;
  createdBy?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// Mock data for development
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
  },
  {
    id: "6",
    name: "Template_New1name",
    description: "Template description",
    createdBy: "user2",
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

// Custom hook for templates API
export const useTemplates = () => {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  const fetchTemplates = useCallback(async (filters: TemplateFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with actual API call when backend is ready
      const useRealAPI = false; // Set to true when ready to use real API
      
      if (useRealAPI) {
        const searchParams = new URLSearchParams();
        if (filters.isActive !== undefined) searchParams.append('isActive', filters.isActive.toString());
        if (filters.createdBy) searchParams.append('CreatedBy', filters.createdBy);
        if (filters.search) searchParams.append('Search', filters.search);
        if (filters.page) searchParams.append('Page', filters.page.toString());
        if (filters.pageSize) searchParams.append('PageSize', filters.pageSize.toString());

        const response = await fetch(`http://localhost:5294/api/form-templates?${searchParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data: TemplatesResponse = await response.json();
        setTemplates(data.items);
        setTotalItems(data.total);
      } else {
        // Use mock data for development
        let filteredTemplates = [...mockTemplates];
        
        // Apply search filter
        if (filters.search) {
          filteredTemplates = filteredTemplates.filter(template =>
            template.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
            template.description.toLowerCase().includes(filters.search!.toLowerCase())
          );
        }
        
        // Apply isActive filter
        if (filters.isActive !== undefined) {
          filteredTemplates = filteredTemplates.filter(template => template.isActive === filters.isActive);
        }
        
        // Apply createdBy filter
        if (filters.createdBy) {
          filteredTemplates = filteredTemplates.filter(template => template.createdBy === filters.createdBy);
        }
        
        // Apply pagination
        const page = filters.page || 1;
        const pageSize = filters.pageSize || 12;
        const startIndex = (page - 1) * pageSize;
        const paginatedTemplates = filteredTemplates.slice(startIndex, startIndex + pageSize);
        
        setTemplates(paginatedTemplates);
        setTotalItems(filteredTemplates.length);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch templates';
      setError(errorMessage);
      console.error('Error fetching templates:', err);
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
    refetch: fetchTemplates
  };
};

// Custom hook for users API
export const useUsers = () => {
  const [users, setUsers] = useState<Record<string, string>>(mockUsers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async (userId: string): Promise<string> => {
    if (users[userId]) {
      return users[userId];
    }

    setLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with actual API call when backend is ready
      const useRealAPI = false; // Set to true when ready to use real API
      
      if (useRealAPI) {
        const response = await fetch(`http://localhost:5294/api/User/${userId}`);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data: UserResponse = await response.json();
        
        if (data.success) {
          const fullName = `${data.data.firstName} ${data.data.lastName}`;
          setUsers(prev => ({ ...prev, [userId]: fullName }));
          return fullName;
        } else {
          throw new Error(data.message || 'Failed to fetch user');
        }
      } else {
        // Use mock data for development
        const userName = mockUsers[userId] || "Unknown User";
        setUsers(prev => ({ ...prev, [userId]: userName }));
        return userName;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user';
      setError(errorMessage);
      console.error('Error fetching user:', err);
      return "Unknown User";
    } finally {
      setLoading(false);
    }
  }, [users]);

  const fetchMultipleUsers = useCallback(async (userIds: string[]) => {
    const promises = userIds.map(id => fetchUser(id));
    await Promise.all(promises);
  }, [fetchUser]);

  return {
    users,
    loading,
    error,
    fetchUser,
    fetchMultipleUsers
  };
};

// Utility functions
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

export const getStatusInfo = (isActive: boolean) => {
  return {
    label: isActive ? "Completed" : "In Progress",
    className: isActive ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
  };
};
