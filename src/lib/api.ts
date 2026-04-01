import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // send cookies (refresh_token)
});

// Request interceptor — attach access token
apiClient.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the browser set multipart boundary automatically for FormData payloads.
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers && "Content-Type" in config.headers) {
        delete config.headers["Content-Type"];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 by refreshing token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.get(`${API_URL}/auth/refresh`, {
          withCredentials: true,
        });
        const newToken = res.data?.data?.access_token;
        if (newToken) {
          localStorage.setItem("access_token", newToken);
          apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("access_token");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
