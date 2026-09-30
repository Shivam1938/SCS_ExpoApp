// import React, { useEffect, useState } from 'react';
// import { api } from '../services/api';
// import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
// import { colors } from '../theme';
// import AllServicesScreen from '../screens/AllServicesScreen';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import MainTabs from './MainTabs';
// import WelcomeScreen from '../screens/WelcomeScreen';
// import LoginScreen from '../screens/LoginScreen';
// import SignupScreen from '../screens/SignupScreen';
// import ServiceDetailScreen from '../screens/ServiceDetailScreen';
// import BookServiceScreen from '../screens/BookServiceScreen';
// import PaymentScreen from '../screens/PaymentScreen';
// import BookingConfirmedScreen from '../screens/BookingConfirmedScreen';
// import TrackBookingScreen from '../screens/TrackBookingScreen';
// import TechnicianProfileScreen from '../screens/TechnicianProfileScreen';
// import RateServiceScreen from '../screens/RateServiceScreen';
// import AddressesScreen from '../screens/AddressesScreen';
// import AddAddressScreen from '../screens/AddAddressScreen';
// import AddPhoneScreen from '../screens/AddPhoneScreen';
// import BookmarksScreen from '../screens/BookmarksScreen';
// import ProfileInfoScreen from '../screens/ProfileInfoScreen';

// import ResetPasswordScreen from "../screens/ResetPasswordScreen";

// const Stack = createNativeStackNavigator();
// const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.bg } };

// export default function RootNavigator({ onReady }) {
//   const [initial, setInitial] = useState(null);
//   useEffect(() => {
//     api.getSession().then((s) => setInitial(s ? 'Main' : 'Welcome')).catch(() => setInitial('Welcome'));
//   }, []);
//   if (!initial) return null;
//   return (
//     <NavigationContainer theme={theme} onReady={onReady}>
//       <Stack.Navigator initialRouteName={initial} screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }}>
//         <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
//         <Stack.Screen name="Login" component={LoginScreen} />
//         <Stack.Screen name="Signup" component={SignupScreen} />
//         <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />
//         <Stack.Screen name="AllServices" component={AllServicesScreen} />
//         <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
//         <Stack.Screen name="BookService" component={BookServiceScreen} />
//         <Stack.Screen name="Payment" component={PaymentScreen} />
//         <Stack.Screen name="BookingConfirmed" component={BookingConfirmedScreen} options={{ gestureEnabled: false, animation: 'fade' }} />
//         <Stack.Screen name="TrackBooking" component={TrackBookingScreen} />
//         <Stack.Screen name="TechnicianProfile" component={TechnicianProfileScreen} />
//         <Stack.Screen name="RateService" component={RateServiceScreen} />
//         <Stack.Screen name="Addresses" component={AddressesScreen} />
//         <Stack.Screen name="AddAddress" component={AddAddressScreen} />
//         <Stack.Screen name="AddPhone" component={AddPhoneScreen} />
//         <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
//         <Stack.Screen name="HelpSupport" component={ProfileInfoScreen} initialParams={{ page: 'help' }} />
//         <Stack.Screen name="AboutUs" component={ProfileInfoScreen} initialParams={{ page: 'about' }} />
//         <Stack.Screen name="ContactUs" component={ProfileInfoScreen} initialParams={{ page: 'contact' }} />
//         <Stack.Screen name="PrivacyPolicy" component={ProfileInfoScreen} initialParams={{ page: 'privacy' }} />
//         <Stack.Screen name="TermsConditions" component={ProfileInfoScreen} initialParams={{ page: 'terms' }} />
//         <Stack.Screen name="CancellationRefundPolicy" component={ProfileInfoScreen} initialParams={{ page: 'cancellation' }} />
//         <Stack.Screen name="ServicePolicy" component={ProfileInfoScreen} initialParams={{ page: 'servicePolicy' }} />
        
//         <Stack.Screen
//   name="ResetPassword"
//   component={ResetPasswordScreen}
//   options={{ headerShown: false }}
// />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }


import React, { useEffect, useState } from "react";
import { Linking } from "react-native";
import { api } from "../services/api";
import { supabase } from "../services/supabase";
import {
  NavigationContainer,
  DefaultTheme,
} from "@react-navigation/native";
import { colors } from "../theme";
import AllServicesScreen from "../screens/AllServicesScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs from "./MainTabs";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import ServiceDetailScreen from "../screens/ServiceDetailScreen";
import BookServiceScreen from "../screens/BookServiceScreen";
import PaymentScreen from "../screens/PaymentScreen";
import BookingConfirmedScreen from "../screens/BookingConfirmedScreen";
import TrackBookingScreen from "../screens/TrackBookingScreen";
import TechnicianProfileScreen from "../screens/TechnicianProfileScreen";
import RateServiceScreen from "../screens/RateServiceScreen";
import AddressesScreen from "../screens/AddressesScreen";
import AddAddressScreen from "../screens/AddAddressScreen";
import AddPhoneScreen from "../screens/AddPhoneScreen";
import BookmarksScreen from "../screens/BookmarksScreen";
import ProfileInfoScreen from "../screens/ProfileInfoScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";

const Stack = createNativeStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
  },
};


const getAuthParamsFromUrl = (url) => {
  const fragment = url.includes("#")
    ? url.split("#")[1]
    : url.includes("?")
      ? url.split("?")[1]
      : "";

  if (!fragment) return null;

  const params = new URLSearchParams(fragment);

  return {
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token"),
    code: params.get("code"),
    type: params.get("type"),
  };
};

export default function RootNavigator({ onReady }) {
  const [initial, setInitial] = useState(null);
  const [navigationRef, setNavigationRef] = useState(null);

 useEffect(() => {
  let mounted = true;

  const handleRecoveryUrl = async (url) => {
    if (!url || !url.startsWith("fixora://reset-password")) {
      return false;
    }

    try {
      const params = getAuthParamsFromUrl(url);

      if (!params) {
        console.warn("Password recovery link has no auth parameters.");
        return false;
      }

      // PKCE recovery flow
      if (params.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          params.code
        );

        if (error) {
          console.warn(
            "Could not exchange password recovery code:",
            error.message
          );
          return false;
        }

        return true;
      }

      // Legacy/hash recovery flow
      if (params.accessToken && params.refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: params.refreshToken,
        });

        if (error) {
          console.warn(
            "Could not restore password recovery session:",
            error.message
          );
          return false;
        }

        return true;
      }

      console.warn("Password recovery link did not contain a valid session.");
      return false;
    } catch (error) {
      console.warn(
        "Could not process password recovery link:",
        error?.message
      );
      return false;
    }
  };

  const handleAuthCallbackUrl = async (url) => {
  if (!url || !url.startsWith("fixora://auth-callback")) {
    return false;
  }

  try {
    const params = getAuthParamsFromUrl(url);

    if (!params) {
      console.warn("Email confirmation link has no auth parameters.");
      return false;
    }

    if (params.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(
        params.code
      );

      if (error) {
        console.warn(
          "Could not exchange email confirmation code:",
          error.message
        );
        return false;
      }

      return true;
    }

    if (params.accessToken && params.refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: params.accessToken,
        refresh_token: params.refreshToken,
      });

      if (error) {
        console.warn(
          "Could not restore email confirmation session:",
          error.message
        );
        return false;
      }

      return true;
    }

    return false;
  } catch (error) {
    console.warn(
      "Could not process email confirmation link:",
      error?.message
    );
    return false;
  }
};

  const setup = async () => {
    try {
      const initialUrl = await Linking.getInitialURL();

      if (initialUrl) {
        const recoveryHandled = await handleRecoveryUrl(initialUrl);

        if (recoveryHandled) {
          if (mounted) {
            setInitial("ResetPassword");
          }
          return;
        }
      }

      const authCallbackHandled = await handleAuthCallbackUrl(initialUrl);

if (authCallbackHandled) {
  if (mounted) {
    setInitial("Login");
  }
  return;
}

      const session = await api.getSession();

      if (mounted) {
        setInitial(session ? "Main" : "Welcome");
      }
    } catch {
      if (mounted) {
        setInitial("Welcome");
      }
    }
  };

  setup();

  // Handle password recovery event from Supabase
  const { data: authListener } = supabase.auth.onAuthStateChange(
    (event) => {
      if (event === "PASSWORD_RECOVERY" && mounted) {
        setInitial("ResetPassword");
      }
    }
  );

  // Handle deep links while the app is already running
  // const subscription = Linking.addEventListener(
  //   "url",
  //   async ({ url }) => {
  //     const recoveryHandled = await handleRecoveryUrl(url);

  //     if (recoveryHandled && navigationRef) {
  //       navigationRef.navigate("ResetPassword");
  //     }
  //   }
  // );

  const subscription = Linking.addEventListener(
  "url",
  async ({ url }) => {
    const recoveryHandled = await handleRecoveryUrl(url);

    if (recoveryHandled && navigationRef) {
      navigationRef.navigate("ResetPassword");
      return;
    }

    const authCallbackHandled = await handleAuthCallbackUrl(url);

    if (authCallbackHandled && navigationRef) {
      navigationRef.navigate("Login");
    }
  }
);

  return () => {
    mounted = false;
    subscription.remove();
    authListener.subscription.unsubscribe();
  };
}, [navigationRef]);
  if (!initial) return null;

  return (
    <NavigationContainer
      theme={theme}
      ref={(ref) => setNavigationRef(ref)}
      onReady={onReady}
    >
      <Stack.Navigator
        initialRouteName={initial}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ animation: "fade" }}
        />

        <Stack.Screen name="Login" component={LoginScreen} />

        <Stack.Screen name="Signup" component={SignupScreen} />

        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ animation: "fade" }}
        />

        <Stack.Screen
          name="AllServices"
          component={AllServicesScreen}
        />

        <Stack.Screen
          name="ServiceDetail"
          component={ServiceDetailScreen}
        />

        <Stack.Screen
          name="BookService"
          component={BookServiceScreen}
        />

        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
        />

        <Stack.Screen
          name="BookingConfirmed"
          component={BookingConfirmedScreen}
          options={{
            gestureEnabled: false,
            animation: "fade",
          }}
        />

        <Stack.Screen
          name="TrackBooking"
          component={TrackBookingScreen}
        />

        <Stack.Screen
          name="TechnicianProfile"
          component={TechnicianProfileScreen}
        />

        <Stack.Screen
          name="RateService"
          component={RateServiceScreen}
        />

        <Stack.Screen
          name="Addresses"
          component={AddressesScreen}
        />

        <Stack.Screen
          name="AddAddress"
          component={AddAddressScreen}
        />

        <Stack.Screen
          name="AddPhone"
          component={AddPhoneScreen}
        />

        <Stack.Screen
          name="Bookmarks"
          component={BookmarksScreen}
        />

        <Stack.Screen
          name="HelpSupport"
          component={ProfileInfoScreen}
          initialParams={{ page: "help" }}
        />

        <Stack.Screen
          name="AboutUs"
          component={ProfileInfoScreen}
          initialParams={{ page: "about" }}
        />

        <Stack.Screen
          name="ContactUs"
          component={ProfileInfoScreen}
          initialParams={{ page: "contact" }}
        />

        <Stack.Screen
          name="PrivacyPolicy"
          component={ProfileInfoScreen}
          initialParams={{ page: "privacy" }}
        />

        <Stack.Screen
          name="TermsConditions"
          component={ProfileInfoScreen}
          initialParams={{ page: "terms" }}
        />

        <Stack.Screen
          name="CancellationRefundPolicy"
          component={ProfileInfoScreen}
          initialParams={{ page: "cancellation" }}
        />

        <Stack.Screen
          name="ServicePolicy"
          component={ProfileInfoScreen}
          initialParams={{ page: "servicePolicy" }}
        />

        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
