import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const AUTH_TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIyIiwiaWQiOjIsImVtYWlsIjoibGV3aXMxN0BuYXZlci5jb20iLCJpYXQiOjE3Njc2NzY2MDQsImV4cCI6MTc2NzY5ODIwNH0.gWWvWoUNRRDw0TmdT3VMs1ju7DgWuiPirD83gm_E4Yf9IZXo7jRmjzSLTc7iX6HX6jpFRS5NkmbY8iJKz9tdJQ";

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${AUTH_TOKEN}`
  }
});
