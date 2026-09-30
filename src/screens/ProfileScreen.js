import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, IconBox, Press, FadeIn, styles } from '../components/ui';
import { colors, radius } from '../theme';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, setUser, refreshProfile } = useApp();
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  useFocusEffect(useCallback(() => {
    refreshProfile().catch((error) => console.warn('profile refresh failed', error?.message));
  }, [refreshProfile]));
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
  const rows = [
    { i: 'location-outline', l: 'Saved Addresses', tint: colors.tealSoft, go: () => navigation.navigate('Addresses') },
    { i: 'bookmark-outline', l: 'Saved Services', tint: colors.orangeSoft, go: () => navigation.navigate('Bookmarks') },
    { i: 'calendar-outline', l: 'My Bookings', tint: '#DDF3EE', go: () => navigation.navigate('Bookings') },
    { i: 'help-circle-outline', l: 'Help & Support', tint: colors.purpleSoft, go: () => navigation.navigate('HelpSupport') },
    { i: 'information-circle-outline', l: 'About Us', tint: colors.tealSoft, go: () => navigation.navigate('AboutUs') },
    { i: 'call-outline', l: 'Contact Us', tint: colors.tealSoft, go: () => navigation.navigate('ContactUs') },
    { i: 'shield-checkmark-outline', l: 'Privacy Policy', tint: colors.purpleSoft, go: () => navigation.navigate('PrivacyPolicy') },
    { i: 'document-text-outline', l: 'Terms & Conditions', tint: colors.tealSoft, go: () => navigation.navigate('TermsConditions') },
    { i: 'return-down-back-outline', l: 'Cancellation / Refund Policy', tint: colors.orangeSoft, go: () => navigation.navigate('CancellationRefundPolicy') },
    { i: 'construct-outline', l: 'Service Policy', tint: '#DDF3EE', go: () => navigation.navigate('ServicePolicy') },
  ];
  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.h1}>Profile</Text>
        </View>
        <FadeIn>
          <Card style={{ marginTop: 18, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Press onPress={changeProfilePhoto} disabled={uploadingPhoto} style={{ alignItems: 'center', opacity: uploadingPhoto ? 0.6 : 1, width: 82 }}>
                <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={{ width: 68, height: 68 }} /> : <Text style={{ fontSize: 24, fontWeight: '700' }}>{(user.name || 'Guest').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</Text>}
                </View>
                <Text numberOfLines={1} style={{ color: colors.teal, fontSize: 11, fontWeight: '600', marginTop: 5 }}>{uploadingPhoto ? 'Uploading…' : 'Change photo'}</Text>
              </Press>
              <View style={{ flex: 1, minWidth: 0, marginLeft: 12, alignItems: 'flex-start' }}>
                <Text numberOfLines={1} style={{ fontSize: 20, fontWeight: '800', color: colors.text, flexShrink: 1 }}>{user.name || 'Guest'}</Text>
                <Text numberOfLines={1} style={{ color: colors.muted, marginTop: 4, fontSize: 15 }}>{user.phone || 'Phone number not added'}</Text>
                <Press accessibilityRole="button" accessibilityLabel="Edit profile" onPress={() => navigation.navigate('AddPhone')} style={{ marginTop: 7, paddingVertical: 3, paddingHorizontal: 2 }}>
                  <Text style={{ color: '#1769AA', fontSize: 14, fontWeight: '700' }}>Edit</Text>
                </Press>
              </View>
            </View>
          </Card>
          <View style={{ backgroundColor: colors.orange, borderRadius: radius.lg, padding: 20, marginTop: 18, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>Sunshine Computer Solution Plus ✨</Text>
              <Text style={{ color: '#FFE3D0', marginTop: 6, fontSize: 15 }}>Priority support and 10% off every visit</Text>
            </View>
            <View style={{ backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 }}>
              <Text style={{ color: '#C24A00', fontWeight: '700' }}>Coming soon</Text>
            </View>
          </View>
        </FadeIn>
        {rows.map((r, i) => (
          <FadeIn key={r.l} delay={100 + i * 70}>
            <Press onPress={r.go} style={{ marginTop: 12 }}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                <IconBox name={r.i} tint={r.tint} size={48} />
                <Text style={{ flex: 1, marginLeft: 16, fontSize: 17, fontWeight: '500' }}>{r.l}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </Card>
            </Press>
          </FadeIn>
        ))}
        <Press onPress={logout} disabled={loggingOut} style={{ marginTop: 26, backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', opacity: loggingOut ? 0.6 : 1 }}>
          <Ionicons name="log-out-outline" size={22} color={colors.muted} />
          <Text style={{ flex: 1, marginLeft: 14, fontSize: 17, color: colors.muted }}>{loggingOut ? 'Signing out…' : 'Logout'}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Press>
      </ScrollView>
    </Screen>
  );
}
