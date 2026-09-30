import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, IconBox, Press, FadeIn, Pill, styles } from '../components/ui';
import { colors, radius } from '../theme';
import { useApp } from '../context/AppContext';

const tabs = ['Upcoming', 'Completed', 'Cancelled'];

export default function BookingsScreen({ navigation }) {
  const { bookings, bookingsLoading, bookingsError, refresh } = useApp();
  const [tab, setTab] = useState('Upcoming');
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const list = bookings.filter((b) =>
    tab === 'Upcoming' ? !['completed', 'cancelled'].includes(b.rawStatus) : tab === 'Completed' ? b.rawStatus === 'completed' : b.rawStatus === 'cancelled');
  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20 }} refreshControl={<RefreshControl refreshing={bookingsLoading} onRefresh={refresh} tintColor={colors.teal} colors={[colors.teal]} />}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.h1}>My bookings</Text>
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: '#E6EBEE', borderRadius: 999, padding: 4, marginTop: 18 }}>
          {tabs.map((t) => (
            <Press key={t} onPress={() => setTab(t)} style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 999, backgroundColor: tab === t ? '#fff' : 'transparent' }}>
              <Text style={{ fontWeight: '600', color: tab === t ? colors.text : colors.muted }}>{t}</Text>
            </Press>
          ))}
        </View>
        <View style={{ backgroundColor: colors.orange, borderRadius: radius.lg, padding: 18, marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16, flex: 1 }}>Save up to ₹300 on your next service</Text>
        </View>
        {bookingsError ? <Card style={{ marginTop: 18 }}>
          <Text style={{ color: '#A83228', lineHeight: 20 }}>{bookingsError}</Text>
          <Press onPress={refresh} style={{ paddingTop: 10 }}><Text style={{ color: colors.teal, fontWeight: '700' }}>Try again</Text></Press>
        </Card> : null}
        {bookingsLoading && bookings.length === 0 ? <ActivityIndicator color={colors.teal} style={{ marginTop: 38 }} /> : null}
        {!bookingsLoading && !bookingsError && list.length === 0 && <Text style={{ textAlign: 'center', color: colors.muted, marginTop: 50 }}>No {tab.toLowerCase()} bookings</Text>}
        {list.map((b, i) => (
          <FadeIn key={b.id} delay={i * 90}>
            <Press onPress={() => navigation.navigate('TrackBooking', { id: b.id })} style={{ marginTop: 16 }}>
              <Card style={{ flexDirection: 'row' }}>
                <IconBox name={b.icon} size={60} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700' }}>{b.service}</Text>
                  <Text style={{ color: colors.muted, marginTop: 6 }}>{b.when}</Text>
                  <Text style={{ color: colors.muted, marginTop: 4 }}>{b.area}</Text>
                  {b.technician?.name ? <Text style={{ color: colors.teal, marginTop: 6, fontWeight: '600' }}>Technician: {b.technician.name}</Text> : null}
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
