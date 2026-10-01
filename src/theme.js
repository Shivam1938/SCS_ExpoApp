import { Platform } from 'react-native';

const LIGHT = {
  orange: '#FF6B00', orangeSoft: '#FFE9DA', teal: '#1596A6', tealSoft: '#E0F2F5',
  purpleSoft: '#ECE8FA', bg: '#F4F8F8', card: '#FFFFFF', text: '#1F2A33',
  muted: '#6B7780', border: '#E3E8EA', star: '#F5B301', success: '#1596A6',
  danger: '#C43D32', input: '#F4F7F8', surface: '#FFFFFF', tab: '#FFFFFF',
};
const DARK = {
  orange: '#FF7A1A', orangeSoft: '#432718', teal: '#36B7C5', tealSoft: '#17373C',
  purpleSoft: '#2C2840', bg: '#101719', card: '#182124', text: '#F4F7F8',
  muted: '#AAB6BB', border: '#2A383D', star: '#F6C453', success: '#36B7C5',
  danger: '#FF8076', input: '#202B2F', surface: '#182124', tab: '#182124',
};

export const colors = { ...LIGHT };
export const getPalette = (mode) => (mode === 'dark' ? DARK : LIGHT);
export const setPalette = (mode) => Object.assign(colors, getPalette(mode));
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };
export const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  default: { elevation: 2 },
});
