import { COLORS } from './colors';
import { LAYOUT } from './layout';
import { FONTS } from './fonts';

export const THEME = {
  colors: COLORS,
  layout: LAYOUT,
  fonts: FONTS,
} as const;

export type Theme = typeof THEME;