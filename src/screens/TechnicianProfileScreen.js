import React from 'react';
import { Alert, Linking, ScrollView, Text, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, Button, FadeIn, styles } from '../components/ui';
import { colors, radius } from '../theme';

export default function TechnicianProfileScreen({ navigation, route }) {
  const d = route.params?.technician || {};
  const t = { name: d.name || 'Technician', role: d.role_title || '', rating: d.rating ?? 5, reviews: d.reviews_count ?? 0, jobs: d.jobs_completed ?? 0,
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
            <View style={{ flex: 1, borderRadius: 60, backgroundColor: '#2A3640', alignItems: 'center', justifyContent: 'center' }}>
              {t.avatarUrl ? <Image source={{ uri: t.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 60 }} /> : <Ionicons name="person" size={60} color="#fff" />}
            </View>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', marginTop: 16 }}>{t.name}</Text>
          <Text style={{ color: colors.muted, marginTop: 6, fontSize: 16 }}>{t.role}</Text>
          <Text style={{ color: colors.muted, marginTop: 5 }}>{t.phone || 'Phone number unavailable'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Ionicons name="star" size={17} color={colors.star} />
            <Text style={{ color: colors.orange, fontWeight: '800', marginLeft: 5 }}>{t.rating}</Text>
            <Text style={{ color: colors.muted }}> with {t.reviews} reviews</Text>
          </View>
        </FadeIn>
        <FadeIn delay={120}>
          <Card style={{ flexDirection: 'row', marginTop: 20, borderRadius: 28 }}>
            {[[t.jobs, 'Jobs completed'], [t.years, 'Years experience'], [t.onTime, 'On-time']].map(([v, l], i) => (
              <View key={l} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i ? 1 : 0, borderColor: colors.border }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.teal }}>{v}</Text>
                <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 4 }}>{l}</Text>
              </View>
            ))}
          </Card>
          <View style={{ backgroundColor: colors.tealSoft, borderRadius: radius.lg, padding: 16, marginTop: 16, alignItems: 'center' }}>
            <Text style={{ fontWeight: '700', textAlign: 'center' }}>{t.verified ? 'Verified Sunshine Computer Solution Pro • Background checked' : 'Sunshine Computer Solution technician'}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <Button title="Call Technician" variant="teal" style={{ flex: 1, marginRight: 8, height: 50 }} onPress={() => openContact('tel:')} />
            <Button title="WhatsApp Technician" style={{ flex: 1, marginLeft: 8, height: 50 }} onPress={openWhatsApp} />
          </View>
          <Text style={[styles.h2, { marginTop: 22 }]}>About {t.name.split(' ')[0]}</Text>
          <Text style={{ color: colors.muted, marginTop: 8, fontSize: 16, lineHeight: 24 }}>{t.about}</Text>
          <Text style={[styles.h2, { marginTop: 22 }]}>Skills</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            {t.skills.map((s, i) => (
              <View key={s} style={{ backgroundColor: i % 2 ? '#E0F0FA' : colors.purpleSoft, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, marginRight: 10, marginBottom: 10 }}>
                <Text style={{ fontSize: 16 }}>{s}</Text>
              </View>
            ))}
          </View>
        </FadeIn>
      </ScrollView>
    </Screen>
  );
}
