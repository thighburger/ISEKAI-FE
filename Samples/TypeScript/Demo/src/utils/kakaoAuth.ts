const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const initiateKakaoLogin = (redirectPath: string = '/') => {
  const redirectUrl = `${window.location.origin}${redirectPath}`;
  const loginUrl = `${SERVER_URL}/oauth2/authorization/kakao?redirect=${encodeURIComponent(redirectUrl)}`;
  
  // 현재 페이지를 카카오 로그인 페이지로 이동
  window.location.href = loginUrl;
};

export const kakaoLogout = () => {
  // 로컬 스토리지에서 토큰 제거
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userInfo');
  
  // 필요시 백엔드 로그아웃 엔드포인트 호출
  // await fetch(`${SERVER_URL}/api/logout`, { ... });
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

export const isLoggedIn = (): boolean => {
  return !!getAccessToken();
};