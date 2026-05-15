import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true
});

let accessToken = localStorage.getItem("pf_access_token");

export function setAccessToken(token) {
  accessToken = token;
  if (token) {
    localStorage.setItem("pf_access_token", token);
  } else {
    localStorage.removeItem("pf_access_token");
  }
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original || original._retry) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original.url?.includes("/api/auth/refresh")) {
      original._retry = true;
      try {
        const refresh = await api.post("/api/auth/refresh");
        const newToken = refresh.data.accessToken;
        setAccessToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
