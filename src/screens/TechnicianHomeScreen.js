import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View, Image, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Press, FadeIn, Pill, styles, ThemedText } from '../components/ui';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function TechnicianHomeScreen({ navigation }) {
  const { user } = useApp();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setBookings(await api.getTechnicianBookings()); } catch (e) { setError(e.message || 'Could not load bookings.'); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const available = bookings.filter((b) => b.rawStatus === 'finding_technician' && !b.technicianId);
  const assigned = bookings.filter((b) => b.technicianId);
  const accept = async (b) => {
    try { await api.acceptBooking(b.dbId); Alert.alert('Booking accepted', 'This booking is now assigned to you.'); await load(); navigation.navigate('TechnicianBookingDetails', { id: b.dbId }); }
    catch (e) { Alert.alert('Booking unavailable', e.message || 'Another technician may have accepted it already.'); await load(); }
  };
  return <Screen edges={['top']}>
    <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.teal} colors={[colors.teal]} />} contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View><ThemedText style={{ color: colors.muted, fontSize: 14 }}>Good to see you</ThemedText><ThemedText style={[styles.h1, { color: colors.text }]}>{user.name || 'Technician'}</ThemedText></View>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.orangeSoft, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="construct-outline" size={24} color={colors.orange} /></View>
      </View>
      <View style={{ marginTop: 18, backgroundColor: colors.teal, borderRadius: radius.lg, padding: 18 }}>
        <ThemedText style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>New service requests</ThemedText>
        <ThemedText style={{ color: '#D8F5F7', marginTop: 5 }}>Accept a request to reserve it for you.</ThemedText>
        <View style={{ flexDirection: 'row', marginTop: 16, alignItems: 'center' }}><ThemedText style={{ color: '#fff', fontSize: 32, fontWeight: '900' }}>{available.length}</ThemedText><ThemedText style={{ color: '#D8F5F7', marginLeft: 10 }}>available now</ThemedText></View>
      </View>
      {error ? <Card style={{ marginTop: 16 }}><ThemedText style={{ color: colors.danger }}>{error}</ThemedText><Press onPress={load} style={{ marginTop: 10 }}><ThemedText style={{ color: colors.teal, fontWeight: '800' }}>Try again</ThemedText></Press></Card> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}><ThemedText style={[styles.h2, { color: colors.text }]}>Available bookings</ThemedText><ThemedText style={{ color: colors.muted }}>{available.length}</ThemedText></View>
      {!loading && available.length === 0 ? <Card style={{ marginTop: 12, alignItems: 'center', padding: 24 }}><Ionicons name="checkmark-circle-outline" size={42} color={colors.teal} /><ThemedText style={{ color: colors.text, fontWeight: '800', marginTop: 10 }}>You're all caught up</ThemedText><ThemedText style={{ color: colors.muted, textAlign: 'center', marginTop: 5 }}>New customer requests will appear here.</ThemedText></Card> : null}
      {available.map((b, i) => <FadeIn key={b.dbId} delay={i * 60}><Press onPress={() => navigation.navigate('TechnicianBookingDetails', { id: b.dbId, booking: b })} style={{ marginTop: 12 }}><Card>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{b.serviceImage ? <Image source={{ uri: b.serviceImage }} style={{ width: 56, height: 56 }} /> : <Ionicons name={b.icon} size={27} color={colors.teal} />}</View>
          <View style={{ flex: 1, marginLeft: 13 }}><ThemedText style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>{b.service}</ThemedText><ThemedText style={{ color: colors.muted, marginTop: 4 }}>{b.when}</ThemedText><ThemedText numberOfLines={1} style={{ color: colors.muted, marginTop: 4 }}>{b.address}</ThemedText></View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}><Pill text="New request" /><View style={{ flex: 1 }} /><Press onPress={() => accept(b)} style={{ backgroundColor: colors.orange, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 }}><ThemedText style={{ color: '#fff', fontWeight: '800' }}>Accept</ThemedText></Press></View>
      </Card></Press></FadeIn>)}
      <ThemedText style={[styles.h2, { color: colors.text, marginTop: 28 }]}>Your active work</ThemedText>
      {assigned.filter((b) => !['completed', 'cancelled'].includes(b.rawStatus)).slice(0, 3).map((b) => <Press key={b.dbId} onPress={() => navigation.navigate('TechnicianBookingDetails', { id: b.dbId, booking: b })} style={{ marginTop: 12 }}><Card><ThemedText style={{ fontWeight: '800', color: colors.text }}>{b.service}</ThemedText><ThemedText style={{ color: colors.muted, marginTop: 4 }}>{b.customer?.full_name || 'Customer'} · {b.when}</ThemedText><Pill text={b.status} style={{ marginTop: 10 }} /></Card></Press>)}
    </ScrollView>
  </Screen>;
}
