import axios from "axios";
import config from "../constants/config";
import { handleApiError } from "../errors/ApiErrorHandler";
const client = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.TIMEOUT,
  headers: {
    timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
    "Content-Type": "application/json",
    
  },
});

client.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem("hastagBillionaire");
    // const token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImlhdCI6MTc3MzczMzA2NSwiZXhwIjoxNzc0MzM3ODY1LCJ0eXBlIjoiYWNjZXNzIiwicm9sZV9pZCI6Nn0.FNJy_wRHTf0EWcQuUChX5t59PaKk6hbC2Y9ctjnjNd0"
    if (token) {
      req.headers['x-access-token'] = `${token}`;
      req.headers['role_id'] = 6;
    }
    return req;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (res) => res,
  (error) => handleApiError(error)
);

export default client;
