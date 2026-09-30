import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { colors } from '../theme';
import AllServicesScreen from '../screens/AllServicesScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';
import BookServiceScreen from '../screens/BookServiceScreen';
import PaymentScreen from '../screens/PaymentScreen';
import BookingConfirmedScreen from '../screens/BookingConfirmedScreen';
import TrackBookingScreen from '../screens/TrackBookingScreen';
import TechnicianProfileScreen from '../screens/TechnicianProfileScreen';
import RateServiceScreen from '../screens/RateServiceScreen';
import AddressesScreen from '../screens/AddressesScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import AddPhoneScreen from '../screens/AddPhoneScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import ProfileInfoScreen from '../screens/ProfileInfoScreen';

const Stack = createNativeStackNavigator();
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.bg } };

export default function RootNavigator({ onReady }) {
  const [initial, setInitial] = useState(null);
  useEffect(() => {
    api.getSession().then((s) => setInitial(s ? 'Main' : 'Welcome')).catch(() => setInitial('Welcome'));
  }, []);
  if (!initial) return null;
  return (
    <NavigationContainer theme={theme} onReady={onReady}>
      <Stack.Navigator initialRouteName={initial} screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />
        <Stack.Screen name="AllServices" component={AllServicesScreen} />
        <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
        <Stack.Screen name="BookService" component={BookServiceScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="BookingConfirmed" component={BookingConfirmedScreen} options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="TrackBooking" component={TrackBookingScreen} />
        <Stack.Screen name="TechnicianProfile" component={TechnicianProfileScreen} />
        <Stack.Screen name="RateService" component={RateServiceScreen} />
        <Stack.Screen name="Addresses" component={AddressesScreen} />
        <Stack.Screen name="AddAddress" component={AddAddressScreen} />
        <Stack.Screen name="AddPhone" component={AddPhoneScreen} />
        <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
        <Stack.Screen name="HelpSupport" component={ProfileInfoScreen} initialParams={{ page: 'help' }} />
        <Stack.Screen name="AboutUs" component={ProfileInfoScreen} initialParams={{ page: 'about' }} />
        <Stack.Screen name="ContactUs" component={ProfileInfoScreen} initialParams={{ page: 'contact' }} />
        <Stack.Screen name="PrivacyPolicy" component={ProfileInfoScreen} initialParams={{ page: 'privacy' }} />
        <Stack.Screen name="TermsConditions" component={ProfileInfoScreen} initialParams={{ page: 'terms' }} />
        <Stack.Screen name="CancellationRefundPolicy" component={ProfileInfoScreen} initialParams={{ page: 'cancellation' }} />
        <Stack.Screen name="ServicePolicy" component={ProfileInfoScreen} initialParams={{ page: 'servicePolicy' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
