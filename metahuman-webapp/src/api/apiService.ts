"use client";

import axios from "axios";

export const apiUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4080";

const apiService = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

apiService.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiService.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiService;
