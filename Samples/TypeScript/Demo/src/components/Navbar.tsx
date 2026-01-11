import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { COLORS, LAYOUT, FONTS } from '@/constants';
import { initiateKakaoLogin, kakaoLogout, isLoggedIn } from '@/utils';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path === '/create-chat') return 'create-chat';
    if (path === '/my-characters') return 'my-characters';
    return '';
  };

  const currentPage = getCurrentPage();
  const loggedIn = isLoggedIn();

  const handleLogin = () => {
    // 현재 페이지로 돌아오도록 설정
    initiateKakaoLogin(location.pathname);
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      kakaoLogout();
      navigate('/');
    }
  };

  return (
    <Nav>
      <NavLeft>
        <Logo to="/">ISEK - AI</Logo>
        
        <NavMenu>
          <NavLink to="/" $active={currentPage === 'home'}>
            홈
          </NavLink>
          <NavLink to="/create-chat" $active={currentPage === 'create-chat'}>
            캐릭터 제작
          </NavLink>
          <NavLink to="/my-characters" $active={currentPage === 'my-characters'}>
            내 캐릭터
          </NavLink>
        </NavMenu>
      </NavLeft>
      
      {loggedIn ? (
        <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
      ) : (
        <LoginButton onClick={handleLogin}>
          <KakaoIcon />
          카카오 로그인
        </LoginButton>
      )}
    </Nav>
  );
};

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: ${LAYOUT.navbar.height};
  width: 100%;
  max-width: ${LAYOUT.container.maxWidth};
  margin: 0 auto;
  background-color: ${COLORS.background.primary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${LAYOUT.spacing['6xl']};
  z-index: 1000;
`;

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${LAYOUT.spacing['2xl']};
`;

const Logo = styled(Link)`
  font-size: ${FONTS.size.xl};
  font-weight: ${FONTS.weight.bold};
  color: ${COLORS.accent.primary};
  letter-spacing: 0.05em;
  text-decoration: none;
`;

const NavMenu = styled.div`
  display: flex;
  gap: ${LAYOUT.spacing.xl};
  align-items: center;
`;

const NavLink = styled(Link)<{ $active: boolean }>`
  font-size: ${FONTS.size.md};
  font-weight: ${props => props.$active ? FONTS.weight.semibold : FONTS.weight.medium};
  color: ${props => props.$active ? '#ffffff' : '#707070'};
  transition: color 0.3s ease;
  cursor: ${props => props.$active ? 'default' : 'pointer'};
  pointer-events: ${props => props.$active ? 'none' : 'auto'};
  text-decoration: none;

  &:hover:not([data-active="true"]) {
    font-weight: ${FONTS.weight.semibold};
    color: ${COLORS.text.secondary};
  }
`;

const LoginButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: ${LAYOUT.spacing.sm} ${LAYOUT.spacing.md};
  border: 2px solid #FEE500;
  border-radius: ${LAYOUT.borderRadius.lg};
  background-color: transparent;
  color: ${COLORS.text.primary};
  font-size: ${FONTS.size.sm};
  font-weight: ${FONTS.weight.medium};
  transition: all 0.3s ease-out;
  cursor: pointer;

  &:hover {
    background-color: #FEE500;
    color: #000000;
    
    svg path {
      fill: #000000;
    }
  }

  &:active {
    transform: scale(0.98);
  }
`;

const LogoutButton = styled.button`
  padding: ${LAYOUT.spacing.sm} ${LAYOUT.spacing.md};
  border: 2px solid ${COLORS.accent.primary};
  border-radius: ${LAYOUT.borderRadius.lg};
  background-color: transparent;
  color: ${COLORS.text.primary};
  font-size: ${FONTS.size.sm};
  font-weight: ${FONTS.weight.medium};
  transition: all 0.3s ease-out;
  cursor: pointer;

  &:hover {
    background-color: ${COLORS.accent.primary};
    color: ${COLORS.text.primary};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const KakaoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3Z" 
      fill="#FEE500"
    />
  </svg>
);