import React, { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Press, ThemedText, ThemedTextInput } from '../components/ui';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const inputStyle = { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border };

export default function AddPhoneScreen({ navigation }) {
  const { user, setUser, refreshProfile } = useApp();
  const [name, setName] = useState(user.name === 'Guest' ? '' : user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoadingProfile(true);
    setError('');
    refreshProfile()
      .then((profile) => {
        if (!active || !profile) return;
        setName(profile.full_name || '');
        setPhone(profile.phone || '');
      })
      .catch(() => { if (active) setError('Could not load your latest profile. Check your connection, then try again.'); })
      .finally(() => { if (active) setLoadingProfile(false); });
    return () => { active = false; };
  }, [refreshProfile]));

  const save = async () => {
    const fullName = name.trim();
    const phoneNumber = phone.trim();
    if (!fullName || fullName.length > 200) {
      setError('Enter your name using 1 to 200 characters.');
      return;
    }
    if (!/^\+?\d{10,15}$/.test(phoneNumber)) {
      setError('Enter a valid phone number with 10 to 15 digits. A leading + is optional.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const profile = await api.saveProfile({ fullName, phone: phoneNumber });
      setUser((current) => ({
        ...current,
        name: profile.full_name || fullName,
        phone: profile.phone || phoneNumber,
        city: profile.city || current.city,
        avatarUrl: profile.avatar_url || null,
      }));
      navigation.goBack();
    } catch (saveError) {
      setError(saveError?.message || 'Could not save your profile. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title="Edit profile" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {loadingProfile ? <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}><ActivityIndicator color={colors.teal} /><ThemedText style={{ color: colors.muted, marginLeft: 9 }}>Loading your profile…</ThemedText></View> : null}
          <ThemedText style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}>Name</ThemedText>
          <ThemedTextInput value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" maxLength={200} returnKeyType="next" style={inputStyle} />

          <ThemedText style={{ color: colors.text, fontWeight: '700', marginTop: 18, marginBottom: 8 }}>Phone Number</ThemedText>
          <ThemedTextInput value={phone} onChangeText={setPhone} placeholder="9899300264 or +919899300264" keyboardType="phone-pad" maxLength={16} returnKeyType="done" style={inputStyle} />
          <ThemedText style={{ color: colors.muted, marginTop: 7, lineHeight: 20 }}>Your phone is saved as entered and is used as the default contact for future bookings.</ThemedText>

          {error ? <ThemedText accessibilityRole="alert" style={{ color: '#C43D32', marginTop: 14, lineHeight: 20 }}>{error}</ThemedText> : null}
          <View style={{ flexDirection: 'row', marginTop: 24 }}>
            <Press accessibilityRole="button" onPress={() => navigation.goBack()} disabled={saving} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginRight: 8 }}>
              <ThemedText style={{ color: colors.text, fontWeight: '700' }}>Cancel</ThemedText>
            </Press>
            <Press accessibilityRole="button" onPress={save} disabled={saving || loadingProfile} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.teal, marginLeft: 8, opacity: saving || loadingProfile ? 0.65 : 1 }}>
              {saving ? <ActivityIndicator color="#fff" /> : <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Save</ThemedText>}
            </Press>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
