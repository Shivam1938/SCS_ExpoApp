import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Text, TextInput, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPalette, setPalette } from '../theme';

const getThemeTextColor = (mode) => getPalette(mode).text;
const getThemeMutedColor = (mode) => getPalette(mode).muted;

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const system = useColorScheme() || 'light';
  const [mode, setMode] = useState('system');
  useEffect(() => {
    AsyncStorage.getItem('scs-theme-mode').then((value) => {
      if (value === 'light' || value === 'dark' || value === 'system') setMode(value);
    }).catch(() => {});
  }, []);
  const resolved = mode === 'system' ? system : mode;
  // Keep the shared palette in sync before descendants render so screens that
  // use the existing theme object immediately receive the selected colors.
  setPalette(resolved);
  Text.defaultProps = { ...(Text.defaultProps || {}), style: { ...(Text.defaultProps?.style || {}), color: getThemeTextColor(resolved) } };
  TextInput.defaultProps = { ...(TextInput.defaultProps || {}), style: { ...(TextInput.defaultProps?.style || {}), color: getThemeTextColor(resolved) }, placeholderTextColor: getThemeMutedColor(resolved) };
  const value = useMemo(() => ({
    mode,
    resolved,
    setMode: async (next) => {
      if (!['light', 'dark', 'system'].includes(next)) return;
      setMode(next);
      try { await AsyncStorage.setItem('scs-theme-mode', next); } catch {}
    },
  }), [mode, resolved]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
