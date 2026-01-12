import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getRedirectPath } from '@/utils/kakaoAuth';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // URL에 accessToken이 있으면 저장하고 리다이렉트
    const accessToken = searchParams.get('accessToken');
    
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      console.log('✅ 로그인 성공!');
      
      // 저장된 경로로 리다이렉트 (없으면 메인)
      const redirectPath = getRedirectPath();
      navigate(redirectPath, { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#fff'
    }}>
      로그인 처리 중...
    </div>
  );
};

export default Login;