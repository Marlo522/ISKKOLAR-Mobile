import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.1.11:5000/api", // Replace with your PC's IP
  timeout: 8000,
});

export const getApiErrorMessage = (err) => {
  if (err?.code === "ECONNABORTED") return "Request timed out. Please try again.";
  if (err?.message === "Network Error") {
    return "Cannot reach server. Check backend and network connection.";
  }
  return err?.response?.data?.message || "Login failed";
};

export const login = (email, password) => API.post("/auth/login", { email, password });

export const getCurrentUser = (token) =>
  API.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } });

export default API;