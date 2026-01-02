// src/constants/fonts.ts
export const FONTS = {
  family: {
    pretendard: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
    netmarble: {
      light: 'NetmarbleL',
      medium: 'NetmarbleM',
      bold: 'NetmarbleB',
    },
  },
  size: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '40px',
    cardTitle: '16px',
    cardDesc: '14px',
  },
  weight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

// 폰트 페이스 정의
export const FONT_FACES = `
  @font-face {
    font-family: 'Pretendard';
    src: url('/src/assets/fonts/Pretendard-Regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url('/src/assets/fonts/Pretendard-Medium.woff2') format('woff2');
    font-weight: 500;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url('/src/assets/fonts/Pretendard-Bold.woff2') format('woff2');
    font-weight: 700;
    font-style: normal;
  }

  @font-face {
    font-family: 'NetmarbleL';
    src: url('/src/assets/fonts/NetmarbleL.woff2') format('woff2');
    font-weight: 300;
    font-style: normal;
  }

  @font-face {
    font-family: 'NetmarbleM';
    src: url('/src/assets/fonts/NetmarbleM.woff2') format('woff2');
    font-weight: 500;
    font-style: normal;
  }

  @font-face {
    font-family: 'NetmarbleB';
    src: url('/src/assets/fonts/NetmarbleB.woff2') format('woff2');
    font-weight: 700;
    font-style: normal;
  }
`;