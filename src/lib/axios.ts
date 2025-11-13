import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000/api";
const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  return config;
});

export default axiosInstance;
