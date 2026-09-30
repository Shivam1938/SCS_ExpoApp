import React from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <RootNavigator onReady={() => SplashScreen.hideAsync().catch(() => {})} />
      </AppProvider>
    </SafeAreaProvider>
  );
}
