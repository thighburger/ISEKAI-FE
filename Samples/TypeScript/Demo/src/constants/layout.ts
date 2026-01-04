// src/constants/layout.ts
export const LAYOUT = {
  // 네비바
  navbar: {
    height: '80px',
  },
  
  // 컨테이너
  container: {
    maxWidth: '1200px',
  },
  
  // 간격 (spacing)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '40px',
    '3xl': '48px',
    '4xl': '56px',
    '5xl': '64px',
    '6xl': '72px',
  },
  
  // 카드
  card: {
    width: '250px',
    height: '320px',
  },
  
  // 테두리 반경
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
} as const;