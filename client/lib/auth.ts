// Authentication utilities for handling tokens and user data

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  tokenType: string;
  userId: number;
  publicId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

// Token storage keys
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_DATA_KEY = "user_data";

// Store authentication data
export const storeAuthData = (authResponse: AuthResponse): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, authResponse.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, authResponse.refreshToken);
  
  // Store user data
  const userData = {
    userId: authResponse.userId,
    publicId: authResponse.publicId,
    email: authResponse.email,
    firstName: authResponse.firstName,
    lastName: authResponse.lastName,
    role: authResponse.role,
    accessTokenExpiresAt: authResponse.accessTokenExpiresAt,
    refreshTokenExpiresAt: authResponse.refreshTokenExpiresAt,
  };
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  
  // Keep backwards compatibility
  localStorage.setItem("access", authResponse.accessToken);
  localStorage.setItem("name", authResponse.firstName);
};

// Get access token
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem("access");
};

// Get refresh token
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// Get user data
export const getUserData = () => {
  const userData = localStorage.getItem(USER_DATA_KEY);
  return userData ? JSON.parse(userData) : null;
};

// Clear all authentication data
export const clearAuthData = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  
  // Clear backwards compatibility tokens
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
  localStorage.removeItem("name");
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  if (!token) return false;
  
  // TODO: Add token expiration check if needed
  return true;
};

// Refresh access token
export const refreshAccessToken = async (): Promise<AuthResponse | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  // Use direct connection (bypass proxy since backend has CORS configured)
  const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "http://10.10.2.133:8080";
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      mode: 'cors',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const authResponse: AuthResponse = await response.json();
      storeAuthData(authResponse);
      return authResponse;
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
  }
  
  return null;
};

// Logout user
export const logout = async (): Promise<void> => {
  const refreshToken = getRefreshToken();
  // Use direct connection (bypass proxy since backend has CORS configured)
  const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "http://10.10.2.133:8080";
  
  if (refreshToken) {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        mode: 'cors',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
    }
  }
  
  clearAuthData();
};
