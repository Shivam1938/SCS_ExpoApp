import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

function ThemeAware({ component: Component, ...props }) {
  useTheme();
  return <Component {...props} />;
}
import HomeScreen from '../screens/HomeScreen';
import BookingsScreen from '../screens/BookingsScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TechnicianHomeScreen from '../screens/TechnicianHomeScreen';
import TechnicianBookingsScreen from '../screens/TechnicianBookingsScreen';

const Tab = createBottomTabNavigator();
const icons = { Home: 'home', Bookings: 'calendar', Alerts: 'notifications', Profile: 'person' };

export default function MainTabs({ route }) {
  const { user } = useApp();
  const { resolved } = useTheme();
  const insets = useSafeAreaInsets();
  const technician = user.role === 'technician';
  return (
    <Tab.Navigator
      initialRouteName={route?.params?.screen || 'Home'}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: { height: 60 + insets.bottom, paddingBottom: insets.bottom + 7, paddingTop: 6, backgroundColor: colors.tab, borderTopWidth: 1, borderTopColor: colors.border, elevation: 0 },
        tabBarIcon: ({ color, focused, size }) => <Ionicons name={focused ? icons[route.name] : `${icons[route.name]}-outline`} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Home">{(props) => <ThemeAware component={technician ? TechnicianHomeScreen : HomeScreen} {...props} />}</Tab.Screen>
      <Tab.Screen name="Bookings">{(props) => <ThemeAware component={technician ? TechnicianBookingsScreen : BookingsScreen} {...props} />}</Tab.Screen>
      <Tab.Screen name="Alerts">{(props) => <ThemeAware component={AlertsScreen} {...props} />}</Tab.Screen>
      <Tab.Screen name="Profile">{(props) => <ThemeAware component={ProfileScreen} {...props} />}</Tab.Screen>
    </Tab.Navigator>
  );
}
