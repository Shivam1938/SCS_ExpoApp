import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, Press, ThemedText } from '../components/ui';
import { colors, radius } from '../theme';

const legalPage = (title) => ({
  title,
  intro: `Approved ${title.toLowerCase()} copy has not been added to this app yet.`,
  sections: [
    { heading: 'Content required', body: `[Replace this placeholder with the approved ${title.toLowerCase()} text before publishing.]` },
    { heading: 'Review', body: 'Confirm this wording with the business owner and the appropriate adviser, then update this page.' },
  ],
});

const PAGES = {
  help: {
    title: 'Help & Support',
    intro: 'Find help with bookings and payment options in the app.',
    faqs: [
      { q: 'How do I book a service?', a: 'Choose a service, select a date and time, then choose a saved address and add a contact phone number before confirming.' },
      { q: 'Where can I see my booking?', a: 'Open My Bookings to see your bookings and select one to view its status.' },
      { q: 'How does payment work?', a: 'The app records the payment method selected with the booking. It does not process an in-app payment transaction.' },
    ],
  },
  about: {
    title: 'About Us',
    intro: 'Sunshine Computer Solution provides computer repair, CCTV installation, networking, and other home technology services.',
    sections: [{ heading: 'The app', body: 'Use the app to browse services, request a visit, choose a saved address, and track a booking.' }],
  },
  contact: {
    title: 'Contact Us',
    intro: 'Official support contact details have not been provided in this project yet.',
    sections: [
      { heading: 'Phone', body: '[Add the official support phone number]' },
      { heading: 'Email', body: '[Add the official support email address]' },
      { heading: 'Business address', body: '[Add the official business address, if applicable]' },
    ],
  },
  privacy: legalPage('Privacy Policy'),
  terms: legalPage('Terms & Conditions'),
  cancellation: legalPage('Cancellation / Refund Policy'),
  servicePolicy: legalPage('Service Policy'),
};

export default function ProfileInfoScreen({ navigation, route }) {
  const page = PAGES[route.params?.page] || PAGES.help;
  const isPlaceholder = ['privacy', 'terms', 'cancellation', 'servicePolicy'].includes(route.params?.page);
  return (
    <Screen>
      <Header title={page.title} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        {isPlaceholder && <View style={{ backgroundColor: colors.orangeSoft, borderRadius: radius.md, padding: 13, marginBottom: 14, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.orange} />
          <ThemedText style={{ color: colors.text, fontWeight: '700', marginLeft: 9, flex: 1 }}>Placeholder copy — replace before publishing</ThemedText>
        </View>}
        <ThemedText style={{ color: colors.muted, fontSize: 15, lineHeight: 23, marginBottom: 14 }}>{page.intro}</ThemedText>

        {page.faqs?.map((item) => <Card key={item.q} style={{ marginBottom: 12 }}>
          <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{item.q}</ThemedText>
          <ThemedText style={{ color: colors.muted, lineHeight: 22, marginTop: 8 }}>{item.a}</ThemedText>
        </Card>)}

        {page.sections?.map((item) => <Card key={item.heading} style={{ marginBottom: 12 }}>
          <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{item.heading}</ThemedText>
          <ThemedText style={{ color: colors.muted, lineHeight: 22, marginTop: 8 }}>{item.body}</ThemedText>
        </Card>)}

        {route.params?.page === 'help' && <>
          <Press onPress={() => navigation.navigate('ContactUs')} style={{ backgroundColor: colors.teal, borderRadius: radius.md, padding: 15, alignItems: 'center', marginTop: 4 }}>
            <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Contact support</ThemedText>
          </Press>
          <Press onPress={() => Alert.alert('Report a problem', 'Support contact details have not been configured yet. Open Contact Us to see the details that still need to be added.', [{ text: 'Open Contact Us', onPress: () => navigation.navigate('ContactUs') }, { text: 'Close', style: 'cancel' }])} style={{ padding: 14, alignItems: 'center' }}>
            <ThemedText style={{ color: colors.teal, fontWeight: '700' }}>Report a problem</ThemedText>
          </Press>
        </>}
      </ScrollView>
    </Screen>
  );
}
