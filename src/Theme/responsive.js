import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro)
const baseWidth = 375;
const baseHeight = 812;

// Scaling functions - Round to avoid precision errors
export const scale = (size) => Math.round((SCREEN_WIDTH / baseWidth) * size);
export const verticalScale = (size) => Math.round((SCREEN_HEIGHT / baseHeight) * size);
export const moderateScale = (size, factor = 0.5) => Math.round(size + (scale(size) - size) * factor);

// Font scaling
export const scaleFont = (size) => size * PixelRatio.getFontScale();

// Device detection
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeDevice = SCREEN_WIDTH >= 414;
export const isTablet = SCREEN_WIDTH >= 768;

// Orientation
export const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;
export const isPortrait = SCREEN_HEIGHT > SCREEN_WIDTH;

// Safe area padding
export const SAFE_AREA_PADDING = {
  top: Platform.OS === 'ios' ? 44 : 0,
  bottom: Platform.OS === 'ios' ? 34 : 0,
};

// Responsive spacing
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
};

// Responsive font sizes
export const fontSize = {
  xs: moderateScale(10),
  sm: moderateScale(12),
  base: moderateScale(14),
  md: moderateScale(16),
  lg: moderateScale(18),
  xl: moderateScale(20),
  xxl: moderateScale(24),
  xxxl: moderateScale(32),
};

// Screen dimensions
export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};

// Helper to get responsive value based on device size
export const getResponsiveValue = (small, medium, large) => {
  if (isSmallDevice) return small;
  if (isMediumDevice) return medium;
  return large;
};
