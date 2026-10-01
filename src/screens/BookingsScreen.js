import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, IconBox, Press, FadeIn, Pill, styles, ThemedText } from '../components/ui';
import { colors, radius } from '../theme';
import { useApp } from '../context/AppContext';

const tabs = ['Active', 'Completed', 'Cancelled'];

export default function BookingsScreen({ navigation }) {
  const { bookings, bookingsLoading, bookingsError, refresh } = useApp();
  const [tab, setTab] = useState('Active');
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const list = bookings.filter((b) =>
    tab === 'Active' ? !['completed', 'cancelled'].includes(b.rawStatus) : tab === 'Completed' ? b.rawStatus === 'completed' : b.rawStatus === 'cancelled');
  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20 }} refreshControl={<RefreshControl refreshing={bookingsLoading} onRefresh={refresh} tintColor={colors.teal} colors={[colors.teal]} />}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText style={[styles.h1, { color: colors.text }]}>My bookings</ThemedText>
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: colors.input, borderRadius: 999, padding: 4, marginTop: 18 }}>
          {tabs.map((t) => (
            <Press key={t} onPress={() => setTab(t)} style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 999, backgroundColor: tab === t ? colors.surface : 'transparent' }}>
              <ThemedText style={{ fontWeight: '600', color: tab === t ? colors.text : colors.muted }}>{t}</ThemedText>
            </Press>
          ))}
        </View>
        <View style={{ backgroundColor: colors.orange, borderRadius: radius.lg, padding: 18, marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 16, flex: 1 }}>Save up to ₹300 on your next service</ThemedText>
        </View>
        {bookingsError ? <Card style={{ marginTop: 18 }}>
          <ThemedText style={{ color: '#A83228', lineHeight: 20 }}>{bookingsError}</ThemedText>
          <Press onPress={refresh} style={{ paddingTop: 10 }}><ThemedText style={{ color: colors.teal, fontWeight: '700' }}>Try again</ThemedText></Press>
        </Card> : null}
        {bookingsLoading && bookings.length === 0 ? <ActivityIndicator color={colors.teal} style={{ marginTop: 38 }} /> : null}
        {!bookingsLoading && !bookingsError && list.length === 0 && <ThemedText style={{ textAlign: 'center', color: colors.muted, marginTop: 50 }}>No {tab.toLowerCase()} bookings</ThemedText>}
        {list.map((b, i) => (
          <FadeIn key={b.id} delay={i * 90}>
            <Press onPress={() => navigation.navigate('TrackBooking', { id: b.id })} style={{ marginTop: 16 }}>
              <Card style={{ flexDirection: 'row' }}>
                {b.serviceImage ? <Image source={{ uri: b.serviceImage }} style={{ width: 60, height: 60, borderRadius: 16 }} /> : <IconBox name={b.icon} size={60} />}
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>{b.service}</ThemedText>
                  <ThemedText style={{ color: colors.muted, marginTop: 6 }}>{b.when}</ThemedText>
                  <ThemedText style={{ color: colors.muted, marginTop: 4 }}>{b.area}</ThemedText>
                  {b.technician?.name ? <ThemedText style={{ color: colors.teal, marginTop: 6, fontWeight: '700' }}>Technician: {b.technician.name}</ThemedText> : null}
                  {b.total != null ? <ThemedText style={{ color: colors.text, marginTop: 6, fontWeight: '900' }}>Final amount: ₹{Number(b.total).toLocaleString('en-IN')}</ThemedText> : null}
                  <Pill text={b.status} style={{ marginTop: 10 }} tint={b.status === 'Finding technician' ? colors.tealSoft : '#E6EEF3'} />
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </Card>
            </Press>
          </FadeIn>
        ))}
      </ScrollView>
    </Screen>
  );
}
