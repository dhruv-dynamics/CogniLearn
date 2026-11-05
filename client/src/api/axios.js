import axios from "axios";

const API = axios.create({
  baseURL: "/api",   // ✅ Use Vite proxy
  withCredentials: true,
});

// 🔐 Attach token automatically
API.interceptors.request.use((req) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;

