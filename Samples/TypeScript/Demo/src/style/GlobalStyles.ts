// src/styles/GlobalStyles.ts
import { createGlobalStyle } from 'styled-components';
import { COLORS, FONTS, FONT_FACES } from '@/constants';

export const GlobalStyles = createGlobalStyle`
  ${FONT_FACES}

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    width: 100%;
    height: 100%;
    font-family: ${FONTS.family.pretendard};
    color: ${COLORS.text.primary};
    background-color: ${COLORS.background.primary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font-family: inherit;
    cursor: pointer;
  }

  input, textarea {
    font-family: inherit;
  }
`;