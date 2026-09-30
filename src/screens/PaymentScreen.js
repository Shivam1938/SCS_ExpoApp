import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, Button, Press, FadeIn } from '../components/ui';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function PaymentScreen({ navigation, route }) {
  const { serviceId, date, time, note, addressId, addressLine, phone, photos = [] } = route.params;
  const { addBooking, services, servicesLoading } = useApp();
  const s = services.find((x) => x.id === serviceId);
  const [method, setMethod] = useState('cash');
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [paymentSettingsLoading, setPaymentSettingsLoading] = useState(true);
  const [qrImageError, setQrImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const parts = 800, discount = 100, total = (s?.price || 0) + parts - discount;
  const upiAvailable = Boolean(paymentSettings?.upi_enabled && paymentSettings?.upi_id && paymentSettings?.qr_code_url);

  useEffect(() => {
    let active = true;
    api.getPaymentSettings().then((settings) => {
      if (!active) return;
      setPaymentSettings(settings);
      setMethod(settings?.upi_enabled && settings?.upi_id && settings?.qr_code_url ? 'upi' : 'cash');
    }).catch(() => {
      if (active) { setPaymentSettings(null); setMethod('cash'); }
    }).finally(() => { if (active) setPaymentSettingsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => { setQrImageError(false); }, [paymentSettings?.qr_code_url]);

  if (servicesLoading) return <Screen><Header title="Payment" onBack={() => navigation.goBack()} /><View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={colors.teal} /></View></Screen>;
  if (!s) return <Screen><Header title="Service unavailable" onBack={() => navigation.goBack()} /><View style={{ padding: 20 }}><Text style={{ color: colors.muted }}>This service is no longer available.</Text></View></Screen>;

  const pay = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    try {
      const res = await api.createBooking({ serviceId: s.id, date, time, method, note, addressId, phone, photos });
      addBooking(res);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }, { name: 'BookingConfirmed', params: { id: res.id, service: res.service, when: res.when, photoUploadError: res.photoUploadError } }] });
    } catch (e) {
      const message = e.message?.includes('phone')
        ? 'Please add your phone number before booking.'
        : e.message?.includes('address')
          ? 'Please choose one of your saved addresses before booking.'
          : e.message?.includes('date') || e.message?.includes('time')
            ? 'Choose a valid date and time in the future.'
            : e.message?.includes('UPI payment')
              ? 'Online UPI payment is unavailable. Choose cash on service.'
          : 'We could not create your booking. Check your connection and try again.';
      Alert.alert('Booking failed', message);
      submitting.current = false;
      setLoading(false);
    }
  };
  const Row = ({ l, v, c }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
      <Text style={{ color: colors.muted, fontSize: 16 }}>{l}</Text><Text style={{ fontSize: 16, color: c || colors.text }}>{v}</Text>
    </View>
  );
  return (
    <Screen>
      <Header title="Payment" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <FadeIn>
          <Card>
            <Text style={{ fontSize: 20, fontWeight: '800' }}>{s.name}</Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>Technician assignment will be shown when confirmed.</Text>
            <Text style={{ color: colors.muted, marginTop: 2 }}>{new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {time}</Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>Service address: {addressLine}</Text>
            <Row l="Service visit" v={`₹${s.price}`} />
            <Row l="Estimated parts" v={`₹${parts}`} />
            <Row l="Discount" v={`-₹${discount}`} c={colors.orange} />
            <View style={{ height: 1, backgroundColor: colors.border, marginTop: 14 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '800' }}>Total payable</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.orange }}>₹{total}</Text>
            </View>
          </Card>
          <View style={{ backgroundColor: colors.tealSoft, borderRadius: radius.md, padding: 14, marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.teal} />
            <Text style={{ marginLeft: 10, color: '#2B5560', fontWeight: '600', flex: 1 }}>Payment is recorded as pending until it is verified.</Text>
          </View>
        </FadeIn>

        {paymentSettingsLoading ? <Card style={{ marginTop: 18, alignItems: 'center' }}><ActivityIndicator color={colors.teal} /><Text style={{ color: colors.muted, marginTop: 8 }}>Loading payment options…</Text></Card> : (
          <>
            {!upiAvailable ? <Card style={{ marginTop: 18 }}><Text style={{ fontWeight: '700' }}>Online payment unavailable</Text><Text style={{ color: colors.muted, lineHeight: 22, marginTop: 6 }}>Cash payment is available for this booking.</Text></Card> : <>
              <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 24, marginBottom: 12 }}>Choose payment method</Text>
              <View style={{ flexDirection: 'row', backgroundColor: '#E6EBEE', borderRadius: radius.md, padding: 4 }}>
                {[["upi", "UPI"], ["cash", "Cash on service"]].map(([key, label]) => (
                  <Press key={key} onPress={() => setMethod(key)} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: method === key ? '#fff' : 'transparent' }}>
                    <Text style={{ fontWeight: '600', color: method === key ? colors.text : colors.muted }}>{label}</Text>
                  </Press>
                ))}
              </View>
            </>}

            {upiAvailable && method === 'upi' ? <FadeIn key="upi"><Card style={{ marginTop: 14, alignItems: 'center' }}>
              <Text style={{ fontWeight: '700', alignSelf: 'flex-start' }}>Pay using UPI</Text>
              <Text style={{ color: colors.muted, alignSelf: 'flex-start', marginTop: 10 }}>UPI ID</Text>
              <Text selectable style={{ fontSize: 17, fontWeight: '700', alignSelf: 'flex-start', marginTop: 3 }}>{paymentSettings.upi_id}</Text>
              {qrImageError ? <Text style={{ color: colors.muted, marginTop: 16 }}>The QR code could not be loaded. You can use the UPI ID above.</Text> : <Image key={paymentSettings.qr_code_url} source={{ uri: paymentSettings.qr_code_url }} onError={() => setQrImageError(true)} resizeMode="contain" style={{ width: 220, height: 220, marginTop: 14 }} />}
              <Text style={{ color: colors.muted, textAlign: 'center', lineHeight: 21, marginTop: 10 }}>Scan the QR code with your UPI app. Payment is not marked as paid until it is verified.</Text>
            </Card></FadeIn> : null}
            {method === 'cash' ? <FadeIn key="cash"><Card style={{ marginTop: 14 }}><Text style={{ color: colors.muted, lineHeight: 22 }}>Pay ₹{total} in cash to the technician after the service is completed.</Text></Card></FadeIn> : null}
            <Button title={loading ? 'Please wait...' : 'Confirm booking'} disabled={loading || paymentSettingsLoading} style={{ marginTop: 22 }} onPress={pay} />
          </>
        )}
        {loading ? <View style={{ marginTop: 10, alignItems: 'center' }}><ActivityIndicator color={colors.orange} /><Text style={{ color: colors.muted, marginTop: 8 }}>{photos.length ? 'Creating booking and uploading photos...' : 'Creating booking...'}</Text></View> : null}
      </ScrollView>
    </Screen>
  );
}
