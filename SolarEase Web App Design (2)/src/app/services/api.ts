import axios from "axios";

/** Dev: `/api` via Vite proxy. Vercel: `/api` via vercel.json rewrites. Direct: set VITE_API_URL. */
const API_ROOT = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const API_BASE_URL = API_ROOT ? `${API_ROOT}/api` : "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach JWT token and user headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Inject user headers for role-based access control
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      // userId in localStorage is actually the UUID from identity-service
      if (user.userId) config.headers["X-User-Id"] = user.userId;
      if (user.email) config.headers["X-User-Email"] = user.email;
      if (user.role) config.headers["X-User-Role"] = user.role;
    } catch (e) {
      // User object parsing failed, skip header injection
    }
  }

  return config;
});

// Response interceptor: handle 401 + auto refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefresh } = res.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefresh);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = "/";
          return Promise.reject(error);
        }
      } else {
        localStorage.clear();
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
