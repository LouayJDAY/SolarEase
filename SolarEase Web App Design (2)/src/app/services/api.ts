import axios from "axios";

const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
