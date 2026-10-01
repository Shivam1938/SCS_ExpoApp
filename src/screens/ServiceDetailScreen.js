import React from 'react';
// import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { ActivityIndicator, Alert, Image, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, IconBox, Button, FadeIn, Pill, Press, styles, ThemedText } from '../components/ui';
import { colors, radius } from '../theme';
import { included } from '../data/mock';
import { useApp } from '../context/AppContext';

export default function ServiceDetailScreen({ navigation, route }) {
  const { services, servicesLoading, bookmarks, pendingBookmarks, toggleBookmark } = useApp();
  const s = services.find((x) => x.id === route.params.id);
  const bookmarked = s ? bookmarks.includes(s.id) : false;
  const savingBookmark = pendingBookmarks.includes(s.id);
  const onBookmarkPress = async () => {
    try { await toggleBookmark(s.id); }
    catch { Alert.alert('Could not update saved services', 'Check your connection and try again.'); }
  };
  if (servicesLoading) return <Screen><Header title="Service details" onBack={() => navigation.goBack()} /><View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={colors.teal} /></View></Screen>;
  if (!s) return <Screen><Header title="Service unavailable" onBack={() => navigation.goBack()} /><View style={{ padding: 20 }}><ThemedText style={{ color: colors.muted }}>This service is no longer available.</ThemedText></View></Screen>;
  return (
    <Screen>
      <Header title={s.name} onBack={() => navigation.goBack()} right={<Press accessibilityLabel={bookmarked ? 'Remove saved service' : 'Save service'} disabled={savingBookmark} onPress={onBookmarkPress} style={{ padding: 6, opacity: savingBookmark ? 0.5 : 1 }}><Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={24} color={bookmarked ? colors.orange : colors.text} /></Press>} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <FadeIn>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {/* <View style={{ height: 200, backgroundColor: '#22303A', justifyContent: 'flex-end', padding: 16 }}>
              <View style={{ width: 76, height: 76, borderRadius: 20, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={s.icon} size={38} color="#fff" />
              </View>
            </View> */}
            <View style={{ height: 230, backgroundColor: colors.card, justifyContent: 'flex-end', padding: 0, overflow: 'hidden' }}>
  {s.image_url ? (
    <Image
      source={{ uri: s.image_url }}
      style={{ width: '100%', height: '100%' }}
      resizeMode="cover"
    />
  ) : (
    <View style={{ width: 76, height: 76, borderRadius: 20, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={s.icon} size={38} color="#fff" />
    </View>
  )}
</View>
            <View style={{ padding: 18 }}>
              <ThemedText style={{ fontSize: 26, fontWeight: '800', color: colors.text }}>{s.name}</ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <Pill text={`${s.rating} ★`} />
                <ThemedText style={{ color: colors.muted, marginLeft: 10 }}>{s.bookings.toLocaleString('en-IN')} bookings</ThemedText>
              </View>
              <ThemedText style={{ color: colors.orange, fontSize: 20, fontWeight: '800', marginTop: 12 }}>From ₹{s.price}</ThemedText>
              <ThemedText style={{ color: colors.muted, marginTop: 10, lineHeight: 22 }}>{s.desc}</ThemedText>
            </View>
          </Card>
        </FadeIn>
        <FadeIn delay={150}>
          <Card style={{ marginTop: 16 }}>
            <ThemedText style={[styles.h2, { color: colors.text }]}>What's included</ThemedText>
            {included.map((i, idx) => (
              <View key={i.text} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
                <IconBox name={i.icon} size={40} tint={idx === 3 ? colors.purpleSoft : colors.tealSoft} color={idx === 1 ? colors.orange : colors.teal} />
                <ThemedText style={{ marginLeft: 14, fontSize: 16, color: colors.text }}>{i.text}</ThemedText>
              </View>
            ))}
          </Card>
          <View style={{ backgroundColor: colors.tealSoft, borderRadius: radius.md, padding: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="shield-checkmark" size={24} color={colors.orange} />
            <ThemedText style={{ marginLeft: 12, fontSize: 16, color: colors.text }}>Verified Sunshine Computer Solution professionals</ThemedText>
          </View>
        </FadeIn>
      </ScrollView>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 24, backgroundColor: colors.bg, alignItems: 'center' }}>
        <ThemedText style={{ color: colors.muted, marginBottom: 8 }}>Starting from ₹{s.price}</ThemedText>
        <Button title="Book this service" style={{ alignSelf: 'stretch' }} onPress={() => navigation.navigate('BookService', { id: s.id })} />
      </View>
    </Screen>
  );
}
