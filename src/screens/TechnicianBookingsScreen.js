import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Press, Pill, styles, ThemedText } from '../components/ui';
import { colors } from '../theme';
import { api } from '../services/api';

const tabs = ['Active', 'Completed', 'Cancelled'];
export default function TechnicianBookingsScreen({ navigation }) {
  const [tab, setTab] = useState('Active'); const [bookings, setBookings] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { const all = await api.getTechnicianBookings(); const mine = all.filter((b) => b.technicianId); setBookings(mine); } catch (e) { setError(e.message || 'Could not load bookings.'); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const list = bookings.filter((b) => tab === 'Active' ? !['completed', 'cancelled'].includes(b.rawStatus) : tab === 'Completed' ? b.rawStatus === 'completed' : b.rawStatus === 'cancelled');
  return <Screen edges={['top']}><ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.teal} colors={[colors.teal]} />} contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
    <ThemedText style={[styles.h1, { color: colors.text }]}>My bookings</ThemedText>
    <View style={{ flexDirection: 'row', backgroundColor: colors.input, borderRadius: 14, padding: 4, marginTop: 18 }}>{tabs.map((t) => <Press key={t} onPress={() => setTab(t)} style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11, backgroundColor: tab === t ? colors.surface : 'transparent' }}><ThemedText style={{ color: tab === t ? colors.text : colors.muted, fontWeight: '700' }}>{t}</ThemedText></Press>)}</View>
    {error ? <Card style={{ marginTop: 16 }}><ThemedText style={{ color: colors.danger }}>{error}</ThemedText></Card> : null}
    {loading && bookings.length === 0 ? <ActivityIndicator color={colors.teal} style={{ marginTop: 40 }} /> : null}
    {!loading && !error && list.length === 0 ? <Card style={{ marginTop: 20, alignItems: 'center', padding: 28 }}><Ionicons name="calendar-outline" size={40} color={colors.muted} /><ThemedText style={{ color: colors.muted, marginTop: 10 }}>No {tab.toLowerCase()} bookings.</ThemedText></Card> : null}
    {list.map((b) => <Press key={b.dbId} onPress={() => navigation.navigate('TechnicianBookingDetails', { id: b.dbId, booking: b })} style={{ marginTop: 12 }}><Card><View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ flex: 1 }}><ThemedText style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>{b.service}</ThemedText><ThemedText style={{ color: colors.muted, marginTop: 4 }}>{b.customer?.full_name || 'Customer'}</ThemedText><ThemedText style={{ color: colors.muted, marginTop: 4 }}>{b.when}</ThemedText></View><Ionicons name="chevron-forward" size={20} color={colors.muted} /></View><Pill text={b.status} style={{ marginTop: 12 }} /><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}><ThemedText style={{ color: colors.muted }}>Final amount</ThemedText><ThemedText style={{ color: colors.text, fontWeight: '900' }}>{b.finalAmountConfirmed && b.total != null ? `₹${Number(b.total).toLocaleString('en-IN')}` : 'Not set'}</ThemedText></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}><ThemedText style={{ color: colors.muted }}>Payment</ThemedText><ThemedText style={{ color: b.paymentStatus === 'paid' ? colors.teal : colors.orange, fontWeight: '800' }}>{b.paymentStatus === 'paid' ? 'Received' : 'Pending'}</ThemedText></View></Card></Press>)}
  </ScrollView></Screen>;
}
