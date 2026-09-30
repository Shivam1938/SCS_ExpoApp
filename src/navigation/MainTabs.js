import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import BookingsScreen from '../screens/BookingsScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const icons = { Home: 'home', Bookings: 'calendar', Alerts: 'notifications', Profile: 'person' };

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { height: 58 + insets.bottom, paddingBottom: insets.bottom + 6, paddingTop: 6, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EDF1F2', elevation: 0 },
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons name={focused ? icons[route.name] : icons[route.name] + '-outline'} size={size} color={color} />
        ),
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
