import React, { useCallback, useEffect, useState } from 'react';
import { Alert, View, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, IconBox, Pill, Press, FadeIn, ThemedText } from '../components/ui';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const PROGRESS = {
  finding_technician: { done: 1, active: 1, msg: 'Finding the best technician for you' },
  technician_assigned: { done: 2, active: 2, msg: 'Technician assigned to your booking' },
  on_the_way: { done: 3, active: 3, msg: 'Technician is on the way' },
  in_progress: { done: 4, active: 4, msg: 'Service is in progress' },
  completed: { done: 6, active: null, msg: 'Service completed' },
  cancelled: { done: 0, active: null, msg: 'This booking was cancelled' },
};
const LABELS = ['Booked', 'Finding technician', 'Technician assigned', 'On the way', 'In Progress', 'Completed'];
const receiptAmount = (value) => value == null ? 'Not recorded' : `₹${Number(value).toLocaleString('en-IN')}`;

export default function TrackBookingScreen({ navigation, route }) {
  const { id } = route.params;
  const { user } = useApp();
  const [b, setB] = useState(null);
  const [err, setErr] = useState(null);
  const load = useCallback(async () => { try { setB(await api.getBooking(id)); setErr(null); } catch { setErr('Could not load this booking. Check your connection and try again.'); } }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!b?.dbId) return; return api.subscribeBooking(b.dbId, load); }, [b?.dbId]);

  if (!b) {
    return (
      <Screen>
        <Header title="Track booking" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {err ? <ThemedText style={{ color: colors.muted }}>{err}</ThemedText> : <ActivityIndicator color={colors.orange} />}
        </View>
      </Screen>
    );
  }
  const p = PROGRESS[b.rawStatus];
  const cancellable = ['finding_technician', 'technician_assigned'].includes(b.rawStatus);
  const cancel = () => Alert.alert('Cancel booking?', 'This action cannot be undone.', [
    { text: 'No' },
    { text: 'Yes, cancel', style: 'destructive', onPress: async () => {
      try {
        const result = await api.cancelBooking(b.dbId);
        if (!result.ok) { Alert.alert('Could not cancel booking', 'Check your connection and try again.'); return; }
        load();
      } catch { Alert.alert('Could not cancel booking', 'Check your connection and try again.'); }
    } },
  ]);
  const bookedAt = new Date(b.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

  return (
    <Screen>
      <Header title="Track booking" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconBox name="construct-outline" size={60} tint={colors.teal} color="#fff" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>{b.service}</ThemedText>
            <ThemedText style={{ color: colors.muted, marginTop: 4 }}>{b.id}</ThemedText>
          </View>
          <Pill text={b.status} />
        </Card>

        <View style={{ backgroundColor: colors.tealSoft, borderRadius: radius.lg, padding: 18, marginTop: 16 }}>
          <ThemedText style={{ fontSize: 17, fontWeight: '700' }}>{p.msg}</ThemedText>
          <ThemedText style={{ color: colors.muted, marginTop: 6 }}>{b.when}</ThemedText>
          <ThemedText style={{ color: colors.muted, marginTop: 2 }}>{b.address}</ThemedText>
          {b.bookingPhone ? <ThemedText style={{ color: colors.muted, marginTop: 5 }}>Booking phone: {b.bookingPhone}</ThemedText> : null}
        </View>

        <Card style={{ marginTop: 14 }}>
          <ThemedText style={{ fontSize: 18, fontWeight: '800' }}>Booking details</ThemedText>
          <View style={{ marginTop: 12, gap: 7 }}>
            <ThemedText style={{ color: colors.muted }}>Sunshine Computer Solution</ThemedText>
            <ThemedText>Booking ID: {b.id}</ThemedText>
            <ThemedText>Customer: {user.name}</ThemedText>
            <ThemedText>Customer phone: {b.bookingPhone || '—'}</ThemedText>
            <ThemedText>Service: {b.service}</ThemedText>
            <ThemedText>Technician: {b.technician?.name || 'Not assigned'}</ThemedText>
            <ThemedText>Booking date: {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN') : '—'}</ThemedText>
            <ThemedText>Service date/time: {b.when}</ThemedText>
            <ThemedText>Address: {b.address}</ThemedText>
            {!b.finalAmountConfirmed || b.total == null ? (
              <View style={{ marginTop: 8, gap: 7 }}>
                <ThemedText>Payment status: {String(b.paymentStatus || 'pending').toUpperCase()}</ThemedText>
                <ThemedText>Payment date: {b.paymentPaidAt ? new Date(b.paymentPaidAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not paid yet'}</ThemedText>
                <View style={{ backgroundColor: colors.input, borderRadius: 14, padding: 14, marginTop: 4 }}>
                  <ThemedText style={{ color: colors.text, fontWeight: '800' }}>Final price: Yet to be confirmed</ThemedText>
                  <ThemedText style={{ color: colors.muted, marginTop: 4, lineHeight: 20 }}>The technician will inspect the service and confirm the final price. It will appear here once the technician saves the final charges.</ThemedText>
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 8, gap: 7 }}>
                <ThemedText>Payment status: {String(b.paymentStatus || 'pending').toUpperCase()}</ThemedText>
                {b.paymentPaidAt ? <ThemedText>Payment date: {new Date(b.paymentPaidAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</ThemedText> : null}
                <ThemedText>Service fee: {receiptAmount(b.serviceFee)}</ThemedText>
                <ThemedText>Parts: {receiptAmount(b.partsEstimate)}</ThemedText>
                <ThemedText>Discount: {receiptAmount(b.discount)}</ThemedText>
                <ThemedText style={{ fontWeight: '900', fontSize: 18 }}>Final amount: {receiptAmount(b.total)}</ThemedText>
                {b.paymentStatus === 'paid' ? <ThemedText style={{ color: colors.teal, fontWeight: '800' }}>✓ Payment received</ThemedText> : <ThemedText style={{ color: colors.orange, fontWeight: '700' }}>Payment is pending.</ThemedText>}
              </View>
            )}
          </View>
        </Card>

        {b.photoUrls?.length ? <Card style={{ marginTop: 14 }}>
          <ThemedText style={{ fontWeight: '700', marginBottom: 10 }}>Photos for this booking</ThemedText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {b.photoUrls.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} style={{ width: 82, height: 82, borderRadius: 10, marginRight: 8, marginBottom: 8 }} />)}
          </View>
        </Card> : null}

        {b.rawStatus !== 'cancelled' && (
          <View style={{ marginTop: 22, paddingLeft: 4 }}>
            {LABELS.map((label, i) => {
              const done = i < p.done, active = p.active === i;
              return (
                <FadeIn key={label} delay={i * 100}>
                  <View style={{ flexDirection: 'row', minHeight: 70 }}>
                    <View style={{ alignItems: 'center', width: 40 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: done ? colors.teal : active ? '#fff' : '#E6E1F3', borderWidth: active ? 3 : 0, borderColor: colors.orange }}>
                        {done && <Ionicons name="checkmark" size={22} color="#fff" />}
                        {active && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.orange }} />}
                      </View>
                      {i < LABELS.length - 1 && <View style={{ flex: 1, width: 3, backgroundColor: done ? colors.teal : colors.border }} />}
                    </View>
                    <View style={{ marginLeft: 14, paddingTop: 2 }}>
                      <ThemedText style={{ fontSize: 17, fontWeight: active ? '700' : '500', color: active ? colors.teal : done ? colors.text : colors.muted }}>{label}</ThemedText>
                      {i === 0 ? <ThemedText style={{ color: colors.muted, marginTop: 3 }}>{bookedAt}</ThemedText> : null}
                    </View>
                  </View>
                </FadeIn>
              );
            })}
          </View>
        )}

        {b.technician ? (
          <Press onPress={() => navigation.navigate('TechnicianProfile', { technician: b.technician })}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: '#2A3640', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {b.technician.avatar_url
                  ? <Image source={{ uri: b.technician.avatar_url }} style={{ width: 62, height: 62 }} />
                  : <Ionicons name="person" size={30} color="#fff" />}
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <ThemedText style={{ fontSize: 17, fontWeight: '700' }}>{b.technician.name}</ThemedText>
                <ThemedText style={{ color: colors.muted, marginTop: 2 }}>{b.technician.role_title}</ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="star" size={14} color={colors.star} /><ThemedText style={{ marginLeft: 4 }}>{b.technician.rating} rating</ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Card>
          </Press>
        ) : (
          <Card style={{ marginTop: 12 }}><ThemedText style={{ color: colors.muted }}>Technician details will appear here once one has been assigned.</ThemedText></Card>
        )}

        <Press onPress={() => (b.rawStatus === 'completed' ? navigation.navigate('RateService', { booking: b }) : Alert.alert('Review unavailable', 'You can review the service after it has been completed.'))}
          style={{ marginTop: 16, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingVertical: 16, alignItems: 'center' }}>
          <ThemedText style={{ fontSize: 16, fontWeight: '500' }}>Rate service</ThemedText>
        </Press>
        {cancellable && (
          <ThemedText onPress={cancel} style={{ textAlign: 'center', color: '#E5484D', fontWeight: '600', marginTop: 18, fontSize: 15 }}>Cancel booking</ThemedText>
        )}
      </ScrollView>
    </Screen>
  );
}
