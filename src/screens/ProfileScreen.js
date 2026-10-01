import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, IconBox, Press, FadeIn, styles, ThemedText } from '../components/ui';
import { colors, radius } from '../theme';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen({ navigation }) {
  const { user, setUser, refreshProfile } = useApp();
  const { mode, resolved, setMode } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const changeProfilePhoto = async () => {
    if (uploadingPhoto) return;
    setUploadingPhoto(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo access to choose a profile photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, exif: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const avatarUrl = await api.uploadProfilePhoto(result.assets[0]);
      setUser((current) => ({ ...current, avatarUrl }));
    } catch {
      Alert.alert('Could not update profile photo', 'Please choose another photo or try again later.');
    } finally { setUploadingPhoto(false); }
  };
  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const { error } = await api.signOut();
      if (error) throw error;
      const rootNavigation = navigation.getParent();
      const reset = { index: 0, routes: [{ name: 'Welcome' }] };
      if (rootNavigation) rootNavigation.reset(reset);
      else navigation.reset(reset);
    } catch (error) {
      Alert.alert('Could not sign out', error.message || 'Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };
  const customerRows = [
    { i: 'location-outline', l: 'Saved Addresses', tint: colors.tealSoft, go: () => navigation.navigate('Addresses') },
    { i: 'bookmark-outline', l: 'Saved Services', tint: colors.orangeSoft, go: () => navigation.navigate('Bookmarks') },
    { i: 'calendar-outline', l: 'My Bookings', tint: '#DDF3EE', go: () => navigation.navigate('Bookings') },
  ];
  const commonRows = [
    { i: 'mail-outline', l: 'Change Email', tint: colors.tealSoft, go: () => navigation.navigate('ChangeEmail') },
    { i: 'help-circle-outline', l: 'Help & Support', tint: colors.purpleSoft, go: () => navigation.navigate('HelpSupport') },
    { i: 'information-circle-outline', l: 'About Us', tint: colors.tealSoft, go: () => navigation.navigate('AboutUs') },
    { i: 'call-outline', l: 'Contact Us', tint: colors.tealSoft, go: () => navigation.navigate('ContactUs') },
    { i: 'shield-checkmark-outline', l: 'Privacy Policy', tint: colors.purpleSoft, go: () => navigation.navigate('PrivacyPolicy') },
    { i: 'document-text-outline', l: 'Terms & Conditions', tint: colors.tealSoft, go: () => navigation.navigate('TermsConditions') },
    { i: 'return-down-back-outline', l: 'Cancellation / Refund Policy', tint: colors.orangeSoft, go: () => navigation.navigate('CancellationRefundPolicy') },
    { i: 'construct-outline', l: 'Service Policy', tint: '#DDF3EE', go: () => navigation.navigate('ServicePolicy') },
  ];
  const rows = user.role === 'technician' ? commonRows : [...customerRows, ...commonRows];
  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <ThemedText style={[styles.h1, { color: colors.text }]}>Profile</ThemedText>
        </View>
        <FadeIn>
          <Card style={{ marginTop: 18, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Press onPress={changeProfilePhoto} disabled={uploadingPhoto} style={{ alignItems: 'center', opacity: uploadingPhoto ? 0.6 : 1, width: 82 }}>
                <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={{ width: 68, height: 68 }} /> : <ThemedText style={{ fontSize: 24, fontWeight: '700' }}>{(user.name || 'Guest').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</ThemedText>}
                </View>
                <ThemedText numberOfLines={1} style={{ color: colors.teal, fontSize: 11, fontWeight: '600', marginTop: 5 }}>{uploadingPhoto ? 'Uploading…' : 'Change photo'}</ThemedText>
              </Press>
              <View style={{ flex: 1, minWidth: 0, marginLeft: 12, alignItems: 'flex-start' }}>
                <ThemedText numberOfLines={1} style={{ fontSize: 20, fontWeight: '800', color: colors.text, flexShrink: 1 }}>{user.name || 'Guest'}</ThemedText>
                <ThemedText numberOfLines={1} style={{ color: colors.muted, marginTop: 4, fontSize: 15 }}>{user.phone || 'Phone number not added'}</ThemedText>
                <Press accessibilityRole="button" accessibilityLabel="Edit profile" onPress={() => navigation.navigate('AddPhone')} style={{ marginTop: 7, paddingVertical: 3, paddingHorizontal: 2 }}>
                  <ThemedText style={{ color: '#1769AA', fontSize: 14, fontWeight: '700' }}>Edit</ThemedText>
                </Press>
              </View>
            </View>
          </Card>
          <View style={{ backgroundColor: colors.orange, borderRadius: radius.lg, padding: 20, marginTop: 18, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <ThemedText style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>Sunshine Computer Solution Plus ✨</ThemedText>
              <ThemedText style={{ color: '#FFE3D0', marginTop: 6, fontSize: 15 }}>Priority support and 10% off every visit</ThemedText>
            </View>
            <View style={{ backgroundColor: colors.surface, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 }}>
              <ThemedText style={{ color: '#C24A00', fontWeight: '700' }}>Coming soon</ThemedText>
            </View>
          </View>
        </FadeIn>
        {rows.map((r, i) => (
          <FadeIn key={r.l} delay={100 + i * 70}>
            <Press onPress={r.go} style={{ marginTop: 12 }}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                <IconBox name={r.i} tint={r.tint} size={48} />
                <ThemedText style={{ flex: 1, marginLeft: 16, fontSize: 17, fontWeight: '500' }}>{r.l}</ThemedText>
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </Card>
            </Press>
          </FadeIn>
        ))}
        <Card style={{ marginTop: 18, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconBox name={resolved === 'dark' ? 'moon' : 'sunny-outline'} tint={colors.purpleSoft} size={46} />
            <View style={{ flex: 1, marginLeft: 14 }}><ThemedText style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>Appearance</ThemedText><ThemedText style={{ color: colors.muted, marginTop: 3 }}>{resolved === 'dark' ? 'Dark mode' : 'Light mode'}</ThemedText></View>
            <View style={{ flexDirection: 'row', backgroundColor: colors.input, borderRadius: 12, padding: 3 }}>
              {[['light', 'sunny-outline'], ['dark', 'moon-outline']].map(([key, icon]) => <Press key={key} onPress={() => setMode(key)} style={{ width: 42, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: mode === key ? colors.surface : 'transparent' }}><Ionicons name={icon} size={18} color={mode === key ? colors.orange : colors.muted} /></Press>)}
            </View>
          </View>
        </Card>
        <Press onPress={logout} disabled={loggingOut} style={{ marginTop: 26, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', opacity: loggingOut ? 0.6 : 1 }}>
          <Ionicons name="log-out-outline" size={22} color={colors.muted} />
          <ThemedText style={{ flex: 1, marginLeft: 14, fontSize: 17, color: colors.muted }}>{loggingOut ? 'Signing out…' : 'Logout'}</ThemedText>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Press>
      </ScrollView>
    </Screen>
  );
}
