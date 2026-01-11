import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from '@/pages/Router';
import { GlobalStyles } from '@/style/GlobalStyles';

const queryClient = new QueryClient();
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL

function App() {
  useEffect(() => {
    // URL에 accessToken이 있으면 저장하고 제거
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      console.log('로그인 성공!');
      // URL에서 토큰 파라미터 제거
      window.history.replaceState({}, '', window.location.pathname);
      window.location.href = FRONTEND_URL;
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalStyles />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
