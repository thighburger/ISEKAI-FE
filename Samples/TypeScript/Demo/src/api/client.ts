import axios from 'axios';
import { getAccessToken } from '@/utils/kakaoAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const AUTH_TOKEN = getAccessToken();
export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${AUTH_TOKEN}`
  }
});
