import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { COLORS, LAYOUT, FONTS } from '@/constants';
import { initiateKakaoLogin, kakaoLogout, isLoggedIn } from '@/utils/kakaoAuth';
import logOutIcon from '@/assets/icons/log-out-outline.svg';
import kakaoLoginImage from '@/assets/images/kakao_login_medium.png';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userEmail = userInfo.email;
  const userName = userInfo.nickname;
  
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path === '/create-chat') return 'create-chat';
    if (path === '/my-characters') return 'my-characters';
    return '';
  };

  const currentPage = getCurrentPage();
  const loggedIn = isLoggedIn();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogin = () => {
    initiateKakaoLogin(location.pathname);
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      kakaoLogout();
      setIsDropdownOpen(false);
      navigate('/');
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <Nav>
      <NavLeft>
        <Logo to="/">ISEK - AI</Logo>
        
        <NavMenu>
          <NavLink to="/" $active={currentPage === 'home'}>
            홈
          </NavLink>
          {loggedIn && (
            <>
              <NavLink to="/create-chat" $active={currentPage === 'create-chat'}>
                캐릭터 제작
              </NavLink>
              <NavLink to="/my-characters" $active={currentPage === 'my-characters'}>
                내 캐릭터
              </NavLink>
            </>
          )}
        </NavMenu>
      </NavLeft>
      
      {loggedIn ? (
        <ProfileContainer ref={dropdownRef}>
          <ProfileButton onClick={toggleDropdown}>
            <ProfileIcon>
              {userName.charAt(0).toUpperCase()}
            </ProfileIcon>
          </ProfileButton>
          
          {isDropdownOpen && (
            <DropdownMenu>
              <UserInfo>
                <UserName>{userName}</UserName>
                <UserEmail>{userEmail}</UserEmail>
              </UserInfo>
              
              <Divider />
              
              <DropdownItem onClick={handleLogout}>
                <LogoutIcon>
                  <img src={logOutIcon} alt="" />
                </LogoutIcon>
                <span>로그아웃</span>
              </DropdownItem>
            </DropdownMenu>
          )}
        </ProfileContainer>
      ) : (
        <KakaoLoginButton onClick={handleLogin}>
          <img src={kakaoLoginImage} alt="카카오 로그인" />
        </KakaoLoginButton>
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

const ProfileContainer = styled.div`
  position: relative;
`;

const ProfileButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ProfileIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${COLORS.accent.primary} 0%, ${COLORS.accent.secondary} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.text.primary};
  font-size: ${FONTS.size.md};
  font-weight: ${FONTS.weight.semibold};
  user-select: none;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 240px;
  background-color: ${COLORS.background.secondary};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${LAYOUT.borderRadius.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 1001;
  animation: fadeIn 0.15s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const UserInfo = styled.div`
  padding: ${LAYOUT.spacing.md} ${LAYOUT.spacing.lg};
  background-color: rgba(255, 255, 255, 0.03);
`;

const UserName = styled.div`
  font-size: ${FONTS.size.sm};
  font-weight: ${FONTS.weight.semibold};
  color: ${COLORS.text.primary};
  margin-bottom: 4px;
`;

const UserEmail = styled.div`
  font-size: ${FONTS.size.xs};
  color: ${COLORS.text.secondary};
  opacity: 0.7;
`;

const Divider = styled.div`
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: ${LAYOUT.spacing.xs} 0;
`;

const DropdownItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${LAYOUT.spacing.sm};
  padding: ${LAYOUT.spacing.sm} ${LAYOUT.spacing.lg};
  background: none;
  border: none;
  color: ${COLORS.text.primary};
  font-size: ${FONTS.size.sm};
  font-weight: ${FONTS.weight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:active {
    background-color: rgba(255, 255, 255, 0.08);
  }

  span {
    flex: 1;
  }
`;

const LogoutIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.text.secondary};
  
  img {
    width: 16px;
    height: 16px;
    object-fit: contain;
    filter: brightness(0) saturate(100%) invert(54%) sepia(0%) saturate(0%) hue-rotate(173deg) brightness(93%) contrast(89%);
  }
`;

const KakaoLoginButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease-out;
  
  img {
    border-radius: ${LAYOUT.borderRadius.md};
    display: block;
    height: 36px;
    width: auto;
  }

  &:hover {
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.98);
  }
`;