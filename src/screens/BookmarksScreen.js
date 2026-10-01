import React, { useCallback } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, IconBox, Press, ThemedText } from '../components/ui';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { useFocusEffect } from '@react-navigation/native';

export default function BookmarksScreen({ navigation }) {
  const { bookmarks, bookmarksLoading, bookmarksError, pendingBookmarks, toggleBookmark, refresh, services, servicesLoading, refreshServices } = useApp();
  useFocusEffect(useCallback(() => { refreshServices(); }, [refreshServices]));
  const savedServices = bookmarks.map((id) => services.find((service) => service.id === id)).filter(Boolean);
  const remove = async (id) => {
    try { await toggleBookmark(id); }
    catch { Alert.alert('Could not update saved services', 'Check your connection and try again.'); }
  };

  return (
    <Screen>
      <Header title="Saved services" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {bookmarksError ? <Card style={{ marginBottom: 14 }}>
          <ThemedText style={{ color: '#A83228', lineHeight: 20 }}>{bookmarksError}</ThemedText>
          <Press onPress={refresh} style={{ marginTop: 10 }}><ThemedText style={{ color: colors.teal, fontWeight: '700' }}>Try again</ThemedText></Press>
        </Card> : null}
        {(bookmarksLoading || servicesLoading) && !bookmarks.length ? <ActivityIndicator color={colors.teal} style={{ marginTop: 30 }} /> : savedServices.length === 0 ?
          <Card style={{ alignItems: 'center', padding: 26, marginTop: 12 }}>
            <Ionicons name="bookmark-outline" size={36} color={colors.teal} />
            <ThemedText style={{ color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 12 }}>No saved services yet</ThemedText>
            <ThemedText style={{ color: colors.muted, textAlign: 'center', marginTop: 6 }}>Save a service from its details page and it will appear here.</ThemedText>
            <Press onPress={() => navigation.navigate('AllServices')} style={{ marginTop: 16, backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 18 }}>
              <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Browse services</ThemedText>
            </Press>
          </Card> : savedServices.map((service) => <Card key={service.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 12 }}>
              <Press onPress={() => navigation.navigate('ServiceDetail', { id: service.id })} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <IconBox name={service.icon} tint={service.tint} color={service.color} size={54} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{service.name}</ThemedText>
                <ThemedText style={{ color: colors.muted, marginTop: 4 }}>From ₹{service.price}</ThemedText>
              </View>
              </Press>
              <Press accessibilityLabel="Remove saved service" disabled={pendingBookmarks.includes(service.id)} onPress={() => remove(service.id)} style={{ padding: 8, opacity: pendingBookmarks.includes(service.id) ? 0.45 : 1 }}>
                <Ionicons name="bookmark" size={22} color={colors.orange} />
              </Press>
            </Card>)}
      </ScrollView>
    </Screen>
  );
}
