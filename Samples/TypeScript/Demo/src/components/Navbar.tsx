// src/components/Navbar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { COLORS, LAYOUT, FONTS } from '@/constants';

export const Navbar: React.FC = () => {
  const location = useLocation();
  
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path === '/characters') return 'characters';
    if (path === '/my-characters') return 'my-characters';
    return '';
  };

  const currentPage = getCurrentPage();

  const handleLogin = () => {
    console.log('로그인 버튼 클릭');
    alert('로그인 기능은 준비중입니다.');
  };

  return (
    <Nav>
      <NavLeft>
        <Logo to="/">ISEK - AI</Logo>
        
        <NavMenu>
          <NavLink to="/" $active={currentPage === 'home'}>
            홈
          </NavLink>
          <NavLink to="/characters" $active={currentPage === 'characters'}>
            캐릭터 제작
          </NavLink>
          <NavLink to="/my-characters" $active={currentPage === 'my-characters'}>
            내 캐릭터
          </NavLink>
        </NavMenu>
      </NavLeft>
      
      <LoginButton onClick={handleLogin}>로그인</LoginButton>
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