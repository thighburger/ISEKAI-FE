const API_URL = import.meta.env.VITE_API_URL;
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL

export const initiateKakaoLogin =  (redirectPath: string = '/') => {
  sessionStorage.setItem('redirectAfterLogin', redirectPath);
  
  const redirectUrl = `${FRONTEND_URL}`;
  const loginUrl = `${API_URL}/oauth2/authorization/kakao?redirect=${redirectUrl}`;
  // 현재 페이지를 카카오 로그인 페이지로 이동
  window.location.href = loginUrl;
};

export const getRedirectPath = (): string => {
  const path = sessionStorage.getItem('redirectAfterLogin') || '/';
  sessionStorage.removeItem('redirectAfterLogin');
  return path;
};

export const kakaoLogout = () => {
  // 로컬 스토리지에서 토큰 제거
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userInfo');
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

export const isLoggedIn = (): boolean => {
  return !!getAccessToken();
};