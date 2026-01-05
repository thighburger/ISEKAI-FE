// src/constants/colors.ts
export const COLORS = {
  // 기본 색상
  white: '#ffffff',
  black: '#000000',
  
  // 배경 색상
  background: {
    primary: '#141413',
    secondary: '#1a1a1a',
    tertiary: '#2a2a2a',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
  
  // 텍스트 색상
  text: {
    primary: '#ffffff',
    secondary: '#a0a0a0',
    tertiary: '#707070',
    disabled: '#505050',
  },
  
  // 강조 색상
  accent: {
    primary: '#ff5733',
    secondary: '#ff8c66',
    hover: '#ff3d1a',
    active: '#e64d2e',
  },
  
  // 상태 색상
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // 카드 색상
  card: {
    bg: 'transportation',
    bgHover: '#e5e5e5',
    text: '#ffffffff',
    describe: '#dfdfdf',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  
  // 경계선 색상
  border: {
    primary: 'rgba(255, 255, 255, 0.1)',
    secondary: 'rgba(255, 255, 255, 0.05)',
    accent: '#ff5733',
  },
  
  // 그림자
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.15)',
    xl: '0 12px 24px rgba(0, 0, 0, 0.2)',
    accent: '0 8px 24px rgba(255, 87, 51, 0.3)',
  },
  
  // 투명도
  opacity: {
    disabled: 0.5,
    hover: 0.8,
    overlay: 0.9,
  },
} as const;

// 라이트 모드 색상 (추후 구현)
export const COLORS_LIGHT = {
  background: {
    primary: '#ffffff',
    secondary: '#f5f5f5',
    tertiary: '#e5e5e5',
  },
  text: {
    primary: '#000000',
    secondary: '#505050',
    tertiary: '#707070',
  },
} as const;