import React from 'react';
import { Alert, Linking, ScrollView, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, Button, FadeIn, styles, ThemedText } from '../components/ui';
import { colors, radius } from '../theme';

export default function TechnicianProfileScreen({ navigation, route }) {
  const d = route.params?.technician || {};
  const t = { name: d.name || 'Technician', role: d.role_title || '', rating: d.rating ?? null, reviews: d.reviews_count ?? 0, ratingIsAdminSet: Boolean(d.rating_is_admin_set), jobs: d.jobs_completed ?? 0,
    years: d.years_experience ?? 0, onTime: `${d.on_time_percent ?? 100}%`, skills: d.skills || [], about: d.about || '',
    phone: d.phone, avatarUrl: d.avatar_url, verified: d.verified };
  const openContact = (scheme) => {
    if (!t.phone) {
      Alert.alert('Phone number unavailable', 'This technician has not added a phone number.');
      return;
    }
    Linking.openURL(scheme + t.phone).catch(() => Alert.alert('Unable to open app', 'Please try again on your device.'));
  };
  const openWhatsApp = () => {
    const digits = String(t.phone || '').replace(/\D/g, '');
    const indiaNumber = digits.length === 10 ? `91${digits}`
      : digits.length === 11 && digits.startsWith('0') ? `91${digits.slice(1)}`
        : digits.length === 12 && digits.startsWith('91') ? digits : '';
    if (!indiaNumber) {
      Alert.alert('Phone number unavailable', 'A valid Indian mobile number is not available for this technician.');
      return;
    }
    Linking.openURL(`whatsapp://send?phone=${indiaNumber}`).catch(() => Alert.alert('WhatsApp unavailable', 'Install WhatsApp or try again on your device.'));
  };
  return (
    <Screen>
      <Header title="Technician profile" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'stretch' }}>
        <FadeIn style={{ alignItems: 'center' }}>
          <View style={{ width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: colors.teal, padding: 4 }}>
            <View style={{ flex: 1, borderRadius: 60, backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center' }}>
              {t.avatarUrl ? <Image source={{ uri: t.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 60 }} /> : <Ionicons name="person" size={60} color={colors.muted} />}
            </View>
          </View>
          <ThemedText style={{ fontSize: 26, fontWeight: '800', marginTop: 16 }}>{t.name}</ThemedText>
          <ThemedText style={{ color: colors.muted, marginTop: 6, fontSize: 16 }}>{t.role}</ThemedText>
          <ThemedText style={{ color: colors.muted, marginTop: 5 }}>{t.phone || 'Phone number unavailable'}</ThemedText>
          {t.rating != null && (t.reviews > 0 || t.ratingIsAdminSet) ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Ionicons name="star" size={17} color={colors.star} />
              <ThemedText style={{ color: colors.orange, fontWeight: '800', marginLeft: 5 }}>{Number(t.rating).toFixed(1)}</ThemedText>
              {t.reviews > 0 ? <ThemedText style={{ color: colors.muted }}> · {t.reviews} reviews</ThemedText> : <ThemedText style={{ color: colors.muted }}> · Admin rating</ThemedText>}
            </View>
          ) : null}
        </FadeIn>
        <FadeIn delay={120}>
          <Card style={{ flexDirection: 'row', marginTop: 20, borderRadius: 28 }}>
            {[[t.jobs, 'Jobs completed'], [t.years, 'Years experience'], [t.onTime, 'On-time']].map(([v, l], i) => (
              <View key={l} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i ? 1 : 0, borderColor: colors.border }}>
                <ThemedText style={{ fontSize: 22, fontWeight: '800', color: colors.teal }}>{v}</ThemedText>
                <ThemedText style={{ color: colors.muted, textAlign: 'center', marginTop: 4 }}>{l}</ThemedText>
              </View>
            ))}
          </Card>
          <View style={{ backgroundColor: colors.tealSoft, borderRadius: radius.lg, padding: 16, marginTop: 16, alignItems: 'center' }}>
            <ThemedText style={{ fontWeight: '700', textAlign: 'center' }}>{t.verified ? 'Verified Sunshine Computer Solution Pro • Background checked' : 'Sunshine Computer Solution technician'}</ThemedText>
          </View>
          {/* <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <Button title="Call Technician" variant="teal" style={{ flex: 1, marginRight: 8, height: 50 }} onPress={() => openContact('tel:')} />
            <Button title="WhatsApp Technician" style={{ flex: 1, marginLeft: 8, height: 50 }} onPress={openWhatsApp} />
          </View> */}
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
  <Button
    title="Call"
    variant="teal"
    style={{ flex: 1, marginRight: 6, height: 48 }}
    onPress={() => openContact('tel:' + t.phone)}
  />
  <Button
    title="Chat"
    style={{ flex: 1, marginLeft: 6, height: 48 }}
    onPress={openWhatsApp}
  />
</View>
          <ThemedText style={[styles.h2, { color: colors.text, marginTop: 22 }]}>About {t.name.split(' ')[0]}</ThemedText>
          <ThemedText style={{ color: colors.muted, marginTop: 8, fontSize: 16, lineHeight: 24 }}>{t.about}</ThemedText>
          <ThemedText style={[styles.h2, { color: colors.text, marginTop: 22 }]}>Skills</ThemedText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            {t.skills.map((s, i) => (
              <View key={s} style={{ backgroundColor: i % 2 ? colors.tealSoft : colors.purpleSoft, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, marginRight: 10, marginBottom: 10 }}>
                <ThemedText style={{ fontSize: 16 }}>{s}</ThemedText>
              </View>
            ))}
          </View>
        </FadeIn>
      </ScrollView>
    </Screen>
  );
}
