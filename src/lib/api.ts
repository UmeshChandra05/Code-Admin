import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Important: sends cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - automatically add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminAccessToken");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log all requests for debugging
    console.log('[API Request]', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasAuth: !!config.headers.Authorization,
      data: config.data,
      params: config.params
    });
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log('[API Response]', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || '';
    
    // Log error details
    console.error('[API Error]', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status,
      statusText: error.response?.statusText,
      message,
      fullError: error.response?.data,
      errorObject: error
    });

    // Handle auth failures - backend may return 400 or 401 for auth issues
    const isAuthError = status === 401 ||
      (status === 400 && (message.includes('Not Authorized') || message.includes('Session Expired')));

    if (isAuthError) {
      console.warn('[Auth Error] Clearing session and redirecting to login');
      // Unauthorized - clear token and redirect
      localStorage.removeItem("adminAccessToken");
      localStorage.removeItem("adminData");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Generic request wrapper
async function request<T = any>(
  path: string,
  options: { method?: string; data?: any; params?: Record<string, string> } = {}
): Promise<T> {
  try {
    const response = await api({
      url: path,
      method: options.method || "GET",
      data: options.data,
      params: options.params,
    });
    
    // Return the full response data - let consumers handle the structure
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message ||
      error.response?.data?.error?.message ||
      error.message ||
      "Request failed";
    
    console.error('[API Request Failed]', {
      path,
      method: options.method || "GET",
      errorMessage,
      errorData: error.response?.data,
      status: error.response?.status
    });
    
    throw new Error(errorMessage);
  }
}

// Auth - Admin Login
export const adminLogin = async (eid: string, password: string) => {
  try {
    console.log('[Admin Login] Attempting login with eid:', eid);
    // Backend expects 'username' field for admin login
    const response = await api.post("/api/admin/login", {
      username: eid,
      password
    });
    console.log('[Admin Login] Login successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Admin Login] Login failed:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      error: error.response?.data
    });
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error?.message ||
      "Login failed"
    );
  }
};

// Tags
export const createTag = (data: { name: string; description?: string; color?: string }) =>
  request("/api/coding-platform/tag/create", { method: "POST", data });
export const getAllTags = (params?: Record<string, string>) =>
  request("/api/coding-platform/tag/getall", { params });
export const getTag = (id: string) => request(`/api/coding-platform/tag/get/${id}`);
export const updateTag = (id: string, data: any) =>
  request(`/api/coding-platform/tag/update/${id}`, { method: "PUT", data });
export const deleteTag = (id: string) =>
  request(`/api/coding-platform/tag/delete/${id}`, { method: "DELETE" });

// Modules
export const createModule = (data: { name: string; description?: string; order?: number }) =>
  request("/api/coding-platform/module/create", { method: "POST", data });
export const getAllModules = (params?: Record<string, string>) =>
  request("/api/coding-platform/module/getall", { params });
export const getModule = (id: string) => request(`/api/coding-platform/module/get/${id}`);
export const updateModule = (id: string, data: any) =>
  request(`/api/coding-platform/module/update/${id}`, { method: "PUT", data });
export const deleteModule = (id: string) =>
  request(`/api/coding-platform/module/delete/${id}`, { method: "DELETE" });
export const reorderModules = (moduleOrders: Array<{ moduleId: string; order: number }>) =>
  request("/api/coding-platform/module/reorder", { method: "PUT", data: { moduleOrders } });

// Problems
export const createProblem = (data: any) =>
  request("/api/coding-platform/problem/create", { method: "POST", data });
export const getAllProblems = (params?: Record<string, string>) =>
  request("/api/coding-platform/problem/getall", { params });
export const getProblem = (id: string) => request(`/api/coding-platform/problem/get/${id}`);
export const updateProblem = (id: string, data: any) =>
  request(`/api/coding-platform/problem/update/${id}`, { method: "PUT", data });
export const deleteProblem = (id: string) =>
  request(`/api/coding-platform/problem/delete/${id}`, { method: "DELETE" });
export const toggleProblemActive = (id: string) =>
  request(`/api/coding-platform/problem/${id}/toggle-active`, { method: "PATCH" });

// Test Cases
export const addTestCase = (problemId: string, data: any) =>
  request(`/api/coding-platform/problem/${problemId}/testcase`, { method: "POST", data });
export const bulkAddTestCases = (problemId: string, testCases: any[]) =>
  request(`/api/coding-platform/problem/${problemId}/testcases/bulk`, { method: "POST", data: { testCases } });
export const updateTestCase = (id: string, data: any) =>
  request(`/api/coding-platform/problem/testcase/${id}`, { method: "PUT", data });
export const deleteTestCase = (id: string) =>
  request(`/api/coding-platform/problem/testcase/${id}`, { method: "DELETE" });

// Contests
export const createContest = (data: any) =>
  request("/api/coding-platform/contest/create", { method: "POST", data });
export const getAllContests = (params?: Record<string, string>) =>
  request("/api/coding-platform/contest/getall", { params });
export const getContest = (id: string) => request(`/api/coding-platform/contest/get/${id}`);
export const updateContest = (id: string, data: any) =>
  request(`/api/coding-platform/contest/update/${id}`, { method: "PUT", data });
export const deleteContest = (id: string) =>
  request(`/api/coding-platform/contest/delete/${id}`, { method: "DELETE" });
export const addProblemToContest = (contestId: string, data: { problemId: string; points: number; label: string }) =>
  request(`/api/coding-platform/contest/${contestId}/add-problem`, { method: "POST", data });
export const removeProblemFromContest = (contestId: string, problemId: string) =>
  request(`/api/coding-platform/contest/${contestId}/remove-problem/${problemId}`, { method: "DELETE" });
export const reorderContestProblems = (contestId: string, problemOrders: Array<{ problemId: string; order: number }>) =>
  request(`/api/coding-platform/contest/${contestId}/reorder-problems`, { method: "PUT", data: { problemOrders } });
export const publishContest = (id: string) =>
  request(`/api/coding-platform/contest/${id}/publish`, { method: "PATCH" });
export const updateContestStatuses = () =>
  request("/api/coding-platform/contest/update-statuses", { method: "POST" });
export const getContestLeaderboard = (id: string, params?: Record<string, string>) =>
  request(`/api/coding-platform/contest/${id}/leaderboard`, { params });
export const getContestSubmissions = (id: string, params?: Record<string, string>) =>
  request(`/api/coding-platform/contest/${id}/submissions`, { params });

// Submissions
export const getAllSubmissions = (params?: Record<string, string>) =>
  request("/api/coding-platform/submissions", { params });
export const getSubmissionStats = (params?: Record<string, string>) =>
  request("/api/coding-platform/submissions/stats", { params });
export const getSubmission = (id: string) => request(`/api/coding-platform/submissions/${id}`);
export const deleteSubmission = (id: string) =>
  request(`/api/coding-platform/submissions/${id}`, { method: "DELETE" });
