import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, Press, ThemedText } from '../components/ui';
import { colors, radius } from '../theme';
import { api } from '../services/api';

const PAGE_KEYS = {
  help: 'help_support',
  about: 'about_us',
  contact: 'contact_us',
  privacy: 'privacy_policy',
  terms: 'terms_conditions',
  cancellation: 'cancellation_policy',
  servicePolicy: 'service_policy',
};

const FALLBACK_TITLES = {
  help: 'Help & Support',
  about: 'About Us',
  contact: 'Contact Us',
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
  cancellation: 'Cancellation / Refund Policy',
  servicePolicy: 'Service Policy',
};

const splitSections = (content) => {
  const text = String(content || '').trim();
  if (!text) return [];

  return text.split(/\n\s*\n/).map((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length <= 1) {
      return { heading: '', body: lines[0] || '' };
    }
    return { heading: lines[0], body: lines.slice(1).join(' ').trim() };
  }).filter((item) => item.body);
};

export default function ProfileInfoScreen({ navigation, route }) {
  const pageKey = route.params?.page || 'help';
  const contentKey = PAGE_KEYS[pageKey] || PAGE_KEYS.help;
  const [content, setContent] = useState(null);
  const [contact, setContact] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAppContent();
      setContent(data[contentKey] || null);
      if (pageKey === 'contact') {
        setContact(await api.getContactSettings());
      }
    } catch (e) {
      setError(e?.message || 'Could not load this information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [contentKey, pageKey]);

  const sections = useMemo(() => splitSections(content?.content), [content]);
  const intro = pageKey === 'help' ? (sections[0]?.body || 'Need help with your booking or service? Our support team is available to assist you.') : null;
  const title = content?.title || FALLBACK_TITLES[pageKey] || 'Information';

  const openContact = async (type, value) => {
    if (!value) {
      Alert.alert('Not available', 'This contact detail has not been configured yet.');
      return;
    }
    const url = type === 'email' ? `mailto:${value}` : type === 'whatsapp' ? `https://wa.me/${String(value).replace(/\D/g, '')}` : `tel:${value}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open', 'Please try again later.');
    }
  };

  return (
    <Screen>
      <Header title={title} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {loading ? (
          <Card style={{ padding: 18 }}>
            <ThemedText style={{ color: colors.muted }}>Loading information…</ThemedText>
          </Card>
        ) : error ? (
          <Card style={{ padding: 18 }}>
            <ThemedText style={{ color: colors.text, fontWeight: '700' }}>Could not load this information</ThemedText>
            <ThemedText style={{ color: colors.muted, lineHeight: 22, marginTop: 7 }}>{error}</ThemedText>
            <Press onPress={load} style={{ marginTop: 14, backgroundColor: colors.teal, borderRadius: radius.md, padding: 13, alignItems: 'center' }}>
              <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Try again</ThemedText>
            </Press>
          </Card>
        ) : (
          <>
            <ThemedText style={{ color: colors.muted, fontSize: 15, lineHeight: 23, marginBottom: 14 }}>
              {pageKey === 'contact'
                ? 'Contact Sunshine Computer Solution for help with services, bookings and support.'
                : (pageKey === 'help' ? intro : '')}
            </ThemedText>

            {pageKey !== 'contact' && pageKey !== 'help' && sections.map((item, index) => (
              <Card key={`${item.heading || 'section'}-${index}`} style={{ marginBottom: 12, padding: 16 }}>
                {!!item.heading && <ThemedText style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{item.heading}</ThemedText>}
                <ThemedText style={{ color: colors.muted, lineHeight: 23, marginTop: item.heading ? 8 : 0 }}>{item.body}</ThemedText>
              </Card>
            ))}

            {pageKey === 'contact' && (
              <>
                {!Object.values(contact).some(Boolean) && (
                  <Card style={{ marginBottom: 12, padding: 18 }}>
                    <ThemedText style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>Support contact details</ThemedText>
                    <ThemedText style={{ color: colors.muted, lineHeight: 23, marginTop: 8 }}>Phone, WhatsApp, email and business contact details will appear here once they are configured in the admin panel.</ThemedText>
                  </Card>
                )}
                {[
                  ['call-outline', 'Phone', contact.phone, 'phone'],
                  ['logo-whatsapp', 'WhatsApp', contact.whatsapp, 'whatsapp'],
                  ['mail-outline', 'Email', contact.email, 'email'],
                  ['mail-unread-outline', 'Support Email', contact.support_email, 'email'],
                  ['location-outline', 'Address', contact.address, null],
                  ['time-outline', 'Working Hours', contact.working_hours, null],
                  ['globe-outline', 'Website', contact.website, null],
                ].filter(([, , value]) => value).map(([icon, label, value, type]) => (
                  <Press key={label} disabled={!type} onPress={() => type && openContact(type, value)} style={{ marginBottom: 12 }}>
                    <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 15 }}>
                      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={icon} size={21} color={colors.teal} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <ThemedText style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>{label}</ThemedText>
                        <ThemedText style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 3 }}>{value}</ThemedText>
                      </View>
                      {type && <Ionicons name="chevron-forward" size={19} color={colors.muted} />}
                    </Card>
                  </Press>
                ))}
              </>
            )}

            {pageKey === 'help' && (
              <>
                {sections.slice(1).map((item, index) => (
                  <Card key={`faq-${index}`} style={{ marginBottom: 12, padding: 16 }}>
                    {!!item.heading && <ThemedText style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{item.heading}</ThemedText>}
                    <ThemedText style={{ color: colors.muted, lineHeight: 23, marginTop: item.heading ? 8 : 0 }}>{item.body}</ThemedText>
                  </Card>
                ))}
                <Press onPress={() => navigation.navigate('ContactUs')} style={{ backgroundColor: colors.teal, borderRadius: radius.md, padding: 15, alignItems: 'center', marginTop: 4 }}>
                  <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Contact support</ThemedText>
                </Press>
              </>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
