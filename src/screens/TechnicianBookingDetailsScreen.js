import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, Button, Press, Pill, styles, ThemedText, ThemedTextInput } from '../components/ui';
import { colors, radius } from '../theme';
import { api } from '../services/api';

const money = (v) => v == null ? '—' : `₹${Number(v).toLocaleString('en-IN')}`;
const statusActions = { technician_assigned: ['on_the_way', 'On the way'], on_the_way: ['in_progress', 'Start work'], in_progress: ['completed', 'Mark work completed'] };
export default function TechnicianBookingDetailsScreen({ navigation, route }) {
  const [booking, setBooking] = useState(route.params?.booking || null); const [loading, setLoading] = useState(!booking); const [working, setWorking] = useState(false); const [fee, setFee] = useState(booking?.serviceFee?.toString() || ''); const [parts, setParts] = useState(booking?.partsEstimate?.toString() || ''); const [discount, setDiscount] = useState(booking?.discount?.toString() || '0'); const [savingCharge, setSavingCharge] = useState(false);
  const load = async () => { try { setLoading(true); const data = await api.getTechnicianBookings(); const found = data.find((item) => item.dbId === route.params?.id); if (!found) throw new Error('This booking is no longer available.'); setBooking(found); setFee(found.serviceFee?.toString() || ''); setParts(found.partsEstimate?.toString() || ''); setDiscount(found.discount?.toString() || '0'); } catch (e) { Alert.alert('Could not load booking', e.message || 'Please try again.'); } finally { setLoading(false); } };
  useEffect(() => { if (!booking) load(); }, []);
  if (loading || !booking) return <Screen><Header title="Booking" onBack={() => navigation.goBack()} /><View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={colors.teal} /></View></Screen>;
  const customer = booking.customer || {}; const action = statusActions[booking.rawStatus];
  const doStatus = async (next) => { if (working) return; setWorking(true); try { setBooking(await api.updateTechnicianBookingStatus(booking.dbId, next)); } catch (e) { Alert.alert('Could not update status', e.message || 'Please try again.'); } finally { setWorking(false); } };
  const saveCharges = async () => { if (savingCharge) return; setSavingCharge(true); try { setBooking(await api.saveFinalCharges({ dbId: booking.dbId, serviceFee: fee, parts, discount })); Alert.alert('Final amount saved', `Customer can now see ${money(Number(fee || 0) + Number(parts || 0) - Number(discount || 0))}.`); } catch (e) { Alert.alert('Could not save charges', e.message || 'Please check the amounts.'); } finally { setSavingCharge(false); } };
  const markPaid = async () => { try { setWorking(true); setBooking(await api.markPaymentReceived(booking.dbId)); } catch (e) { Alert.alert('Payment not updated', e.message || 'Please try again.'); } finally { setWorking(false); } };
  return <Screen><Header title={booking.service} onBack={() => navigation.goBack()} /><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
    <Card><View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="person-outline" size={28} color={colors.teal} /></View><View style={{ flex: 1, marginLeft: 14 }}><ThemedText style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>{customer.full_name || 'Customer'}</ThemedText><ThemedText style={{ color: colors.muted, marginTop: 4 }}>{customer.phone || booking.bookingPhone || 'No phone'}</ThemedText></View><Pill text={booking.status} /></View>
      <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 16, paddingTop: 14 }}><ThemedText style={{ color: colors.text, fontWeight: '800' }}>{booking.when}</ThemedText><ThemedText style={{ color: colors.muted, lineHeight: 21, marginTop: 6 }}>{booking.address}</ThemedText><ThemedText style={{ color: colors.muted, lineHeight: 21, marginTop: 6 }}>{booking.notes || 'No customer notes.'}</ThemedText></View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}><Button title="Call" variant="teal" style={{ flex: 1 }} onPress={() => booking.bookingPhone ? Linking.openURL(`tel:${booking.bookingPhone}`) : Alert.alert('Phone unavailable')} /><Button title="Chat" variant="outline" style={{ flex: 1 }} onPress={() => booking.bookingPhone ? Linking.openURL(`sms:${booking.bookingPhone}`) : Alert.alert('Phone unavailable')} /></View>
    </Card>
    {booking.photos?.length ? <Card style={{ marginTop: 14 }}><ThemedText style={[styles.h2, { color: colors.text }]}>Customer photos</ThemedText><ThemedText style={{ color: colors.muted, marginTop: 5 }}>Uploaded photos are available from the booking record.</ThemedText></Card> : null}
    {action ? <Button title={working ? 'Updating…' : action[1]} disabled={working} onPress={() => doStatus(action[0])} style={{ marginTop: 14 }} /> : null}
    <Card style={{ marginTop: 16 }}><ThemedText style={[styles.h2, { color: colors.text }]}>Final charges</ThemedText><ThemedText style={{ color: colors.muted, marginTop: 5 }}>Enter the final amount after inspection. The customer will see it immediately.</ThemedText>
      {[[fee, setFee, 'Service charge'], [parts, setParts, 'Parts'], [discount, setDiscount, 'Discount']].map(([value, setter, label]) => <View key={label} style={{ marginTop: 14 }}><ThemedText style={{ color: colors.text, fontWeight: '700', marginBottom: 7 }}>{label}</ThemedText><ThemedTextInput value={value} onChangeText={setter} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.muted} style={{ backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, color: colors.text, borderRadius: radius.md, padding: 14, fontSize: 16 }} /></View>)}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}><ThemedText style={{ color: colors.muted, fontSize: 16 }}>Final total</ThemedText><ThemedText style={{ color: colors.orange, fontSize: 22, fontWeight: '900' }}>{money(Number(fee || 0) + Number(parts || 0) - Number(discount || 0))}</ThemedText></View>
      <Button title={savingCharge ? 'Saving…' : 'Save final amount'} disabled={savingCharge || booking.paymentStatus === 'paid'} onPress={saveCharges} style={{ marginTop: 16 }} />
    </Card>
    {/* {booking.total != null ? <Card style={{ marginTop: 14 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><View><ThemedText style={{ color: colors.muted }}>Payment</ThemedText><ThemedText style={{ color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 3 }}>{money(booking.total)}</ThemedText></View><Pill text={booking.paymentStatus === 'paid' ? 'Received' : 'Pending'} tint={booking.paymentStatus === 'paid' ? colors.tealSoft : colors.orangeSoft} color={booking.paymentStatus === 'paid' ? colors.teal : colors.orange} /></View>{booking.rawStatus === 'completed' && booking.paymentStatus !== 'paid' ? <Button title={working ? 'Updating…' : 'Mark payment received'} disabled={working} variant="teal" onPress={markPaid} style={{ marginTop: 14 }} /> : booking.paymentStatus === 'paid' ? <ThemedText style={{ color: colors.teal, fontWeight: '800', marginTop: 12 }}>Payment received{booking.paymentPaidAt ? ` · ${new Date(booking.paymentPaidAt).toLocaleString('en-IN')}` : ''}</ThemedText>}</Card> : null} */}
  {booking.total != null && (
  <Card style={{ marginTop: 14 }}>
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View>
        <ThemedText style={{ color: colors.muted }}>Payment</ThemedText>
        <ThemedText
          style={{
            color: colors.text,
            fontSize: 22,
            fontWeight: '900',
            marginTop: 3,
          }}
        >
          {money(booking.total)}
        </ThemedText>
      </View>

      <Pill
        text={booking.paymentStatus === 'paid' ? 'Received' : 'Pending'}
        tint={
          booking.paymentStatus === 'paid'
            ? colors.tealSoft
            : colors.orangeSoft
        }
        color={
          booking.paymentStatus === 'paid'
            ? colors.teal
            : colors.orange
        }
      />
    </View>

    {booking.rawStatus === 'completed' &&
      booking.paymentStatus !== 'paid' && (
        <Button
          title={working ? 'Updating…' : 'Mark payment received'}
          disabled={working}
          variant="teal"
          onPress={markPaid}
          style={{ marginTop: 14 }}
        />
      )}

    {booking.paymentStatus === 'paid' && (
      <ThemedText
        style={{
          color: colors.teal,
          fontWeight: '800',
          marginTop: 12,
        }}
      >
        Payment received
        {booking.paymentPaidAt
          ? ` · ${new Date(booking.paymentPaidAt).toLocaleString('en-IN')}`
          : ''}
      </ThemedText>
    )}
  </Card>
)}
  
  </ScrollView></Screen>;
}
