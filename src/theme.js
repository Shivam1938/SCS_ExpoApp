import { Platform } from 'react-native';
export const colors = {
  orange: '#FF6B00', orangeSoft: '#FFE9DA', teal: '#1596A6', tealSoft: '#E0F2F5',
  purpleSoft: '#ECE8FA', bg: '#F4F8F8', card: '#FFFFFF', text: '#1F2A33',
  muted: '#6B7780', border: '#E3E8EA', star: '#F5B301', success: '#1596A6',
};
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };
// iOS gets a soft shadow; Android stays flat (elevation caused underline-like artifacts)
export const shadow = Platform.select({
  ios: { shadowColor: '#0B2A33', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  default: {},
});
