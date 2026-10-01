import React, { useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import MainTabs from './MainTabs';
import WelcomeScreen from '../screens/WelcomeScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import AllServicesScreen from '../screens/AllServicesScreen';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';
import BookServiceScreen from '../screens/BookServiceScreen';
import BookingConfirmedScreen from '../screens/BookingConfirmedScreen';
import TrackBookingScreen from '../screens/TrackBookingScreen';
import TechnicianProfileScreen from '../screens/TechnicianProfileScreen';
import TechnicianReviewsScreen from '../screens/TechnicianReviewsScreen';
import RateServiceScreen from '../screens/RateServiceScreen';
import AddressesScreen from '../screens/AddressesScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import AddPhoneScreen from '../screens/AddPhoneScreen';
import ChangeEmailScreen from '../screens/ChangeEmailScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import ProfileInfoScreen from '../screens/ProfileInfoScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import TechnicianBookingDetailsScreen from '../screens/TechnicianBookingDetailsScreen';

const Stack = createNativeStackNavigator();

function ThemeAware({ component: Component, ...props }) {
  useTheme();
  return <Component {...props} />;
}

const getAuthParamsFromUrl = (url) => {
  const fragment = url?.includes('#') ? url.split('#')[1] : url?.includes('?') ? url.split('?')[1] : '';
  if (!fragment) return null;
  const params = new URLSearchParams(fragment);
  return { accessToken: params.get('access_token'), refreshToken: params.get('refresh_token'), code: params.get('code'), tokenHash: params.get('token_hash'), type: params.get('type') };
};

export default function RootNavigator({ onReady }) {
  const { resolved } = useTheme();
  const [initial, setInitial] = useState(null);
  const navigationRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const exchange = async (url, kind) => {
      const prefix =
        kind === 'reset'
          ? 'fixora://reset-password'
          : kind === 'email'
            ? 'fixora://email-change'
            : 'fixora://auth-callback';
      if (!url?.startsWith(prefix)) return false;

      try {
        const params = getAuthParamsFromUrl(url);

        if (params?.tokenHash && params?.type === 'email_change') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: params.tokenHash,
            type: 'email_change',
          });
          return !error;
        }

        if (!params) return false;

        if (params.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          return !error;
        }

        if (params.accessToken && params.refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: params.accessToken,
            refresh_token: params.refreshToken,
          });
          return !error;
        }
      } catch (error) {
        console.warn(`Could not process ${kind} link:`, error?.message);
      }

      return false;
    };
    const setup = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (await exchange(initialUrl, 'reset')) { if (mounted) setInitial('ResetPassword'); return; }
        if (await exchange(initialUrl, 'auth')) { if (mounted) setInitial('Login'); return; }
        if (await exchange(initialUrl, 'email')) { if (mounted) setInitial('Login'); return; }
        const session = await api.getSession();
        if (mounted) setInitial(session ? 'Main' : 'Welcome');
      } catch { if (mounted) setInitial('Welcome'); }
    };
    setup();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && mounted) setInitial('ResetPassword');
    });
    const notificationSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      const bookingId = data.booking_id || data.bookingId;
      if (!bookingId || !navigationRef.current) return;
      api.getProfile().then((profile) => {
        navigationRef.current?.navigate(profile?.role === 'technician' ? 'TechnicianBookingDetails' : 'TrackBooking', { id: bookingId });
      }).catch(() => {});
    });

    const subscription = Linking.addEventListener('url', async ({ url }) => {
      if (await exchange(url, 'reset') && navigationRef.current) return navigationRef.current.navigate('ResetPassword');
      if (await exchange(url, 'auth') && navigationRef.current) return navigationRef.current.navigate('Login');
      if (await exchange(url, 'email') && navigationRef.current) return navigationRef.current.navigate('Login');
    });
    return () => { mounted = false; subscription.remove(); notificationSubscription.remove(); authListener.subscription.unsubscribe(); };
  }, []);

  if (!initial) return null;
  const theme = { ...DefaultTheme, dark: resolved === 'dark', colors: { ...DefaultTheme.colors, primary: colors.teal, background: colors.bg, card: colors.card, text: colors.text, border: colors.border } };
  return (
    <NavigationContainer theme={theme} ref={navigationRef} onReady={onReady}>
      <Stack.Navigator initialRouteName={initial} screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="Welcome" children={(props) => <ThemeAware component={WelcomeScreen} {...props} />} options={{ animation: 'fade' }} />
        <Stack.Screen name="RoleSelection" children={(props) => <ThemeAware component={RoleSelectionScreen} {...props} />} />
        <Stack.Screen name="Login" children={(props) => <ThemeAware component={LoginScreen} {...props} />} />
        <Stack.Screen name="Signup" children={(props) => <ThemeAware component={SignupScreen} {...props} />} />
        <Stack.Screen name="Main" children={(props) => <ThemeAware component={MainTabs} {...props} />} options={{ animation: 'fade' }} />
        <Stack.Screen name="AllServices" children={(props) => <ThemeAware component={AllServicesScreen} {...props} />} />
        <Stack.Screen name="ServiceDetail" children={(props) => <ThemeAware component={ServiceDetailScreen} {...props} />} />
        <Stack.Screen name="BookService" children={(props) => <ThemeAware component={BookServiceScreen} {...props} />} />
        <Stack.Screen name="BookingConfirmed" children={(props) => <ThemeAware component={BookingConfirmedScreen} {...props} />} options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="TrackBooking" children={(props) => <ThemeAware component={TrackBookingScreen} {...props} />} />
        <Stack.Screen name="TechnicianProfile" children={(props) => <ThemeAware component={TechnicianProfileScreen} {...props} />} />
        <Stack.Screen name="TechnicianReviews" children={(props) => <ThemeAware component={TechnicianReviewsScreen} {...props} />} />
        <Stack.Screen name="TechnicianBookingDetails" children={(props) => <ThemeAware component={TechnicianBookingDetailsScreen} {...props} />} />
        <Stack.Screen name="RateService" children={(props) => <ThemeAware component={RateServiceScreen} {...props} />} />
        <Stack.Screen name="Addresses" children={(props) => <ThemeAware component={AddressesScreen} {...props} />} />
        <Stack.Screen name="AddAddress" children={(props) => <ThemeAware component={AddAddressScreen} {...props} />} />
        <Stack.Screen name="AddPhone" children={(props) => <ThemeAware component={AddPhoneScreen} {...props} />} />
        <Stack.Screen name="ChangeEmail" children={(props) => <ThemeAware component={ChangeEmailScreen} {...props} />} />
        <Stack.Screen name="Bookmarks" children={(props) => <ThemeAware component={BookmarksScreen} {...props} />} />
        <Stack.Screen name="HelpSupport" children={(props) => <ThemeAware component={ProfileInfoScreen} {...props} />} initialParams={{ page: 'help' }} />
        <Stack.Screen name="AboutUs" children={(props) => <ThemeAware component={ProfileInfoScreen} {...props} />} initialParams={{ page: 'about' }} />
        <Stack.Screen name="ContactUs" children={(props) => <ThemeAware component={ProfileInfoScreen} {...props} />} initialParams={{ page: 'contact' }} />
        <Stack.Screen name="PrivacyPolicy" children={(props) => <ThemeAware component={ProfileInfoScreen} {...props} />} initialParams={{ page: 'privacy' }} />
        <Stack.Screen name="TermsConditions" children={(props) => <ThemeAware component={ProfileInfoScreen} {...props} />} initialParams={{ page: 'terms' }} />
        <Stack.Screen name="CancellationRefundPolicy" children={(props) => <ThemeAware component={ProfileInfoScreen} {...props} />} initialParams={{ page: 'cancellation' }} />
        <Stack.Screen name="ServicePolicy" children={(props) => <ThemeAware component={ProfileInfoScreen} {...props} />} initialParams={{ page: 'servicePolicy' }} />
        <Stack.Screen name="ResetPassword" children={(props) => <ThemeAware component={ResetPasswordScreen} {...props} />} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
