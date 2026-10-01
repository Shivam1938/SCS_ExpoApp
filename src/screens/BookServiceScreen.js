import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, View, ActivityIndicator, Platform, Alert, Image, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, Button, Press, FadeIn, IconBox, styles, ThemedText, ThemedTextInput } from '../components/ui';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { useFocusEffect } from '@react-navigation/native';

const dateToISO = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const formatDate = (date) => date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const formatTime = (date) => date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
const addressText = (item) => [item.line, item.city, item.pincode].filter(Boolean).join(', ');
const makeUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; const v = c === 'x' ? r : (r & 0x3) | 0x8; return v.toString(16); });
const nextSelectableTime = () => {
  const value = new Date(Date.now() + 30 * 60 * 1000);
  value.setMinutes(Math.ceil(value.getMinutes() / 15) * 15, 0, 0);
  return value;
};

export default function BookServiceScreen({ navigation, route }) {
  const { selectedAddress, setSelectedAddress, user, services, servicesLoading, refreshServices, addBooking } = useApp();
  const s = services.find((x) => x.id === route.params.id);
  const [schedule, setSchedule] = useState(nextSelectableTime);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressesError, setAddressesError] = useState('');
  const [addressLoadAttempt, setAddressLoadAttempt] = useState(0);
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState(user.phone || '');
  const [editingPhone, setEditingPhone] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [pickingPhotos, setPickingPhotos] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const continueRef = useRef(false);
  const clientRequestIdRef = useRef(makeUuid());

  useFocusEffect(useCallback(() => {
    continueRef.current = false;
    refreshServices();
    let active = true;
    setAddressesLoading(true);
    setAddressesError('');
    api.getAddresses()
      .then((items) => {
        if (!active) return;
        setAddresses(items);
        const preferred = items.find((item) => item.id === selectedAddress?.id) || items.find((item) => item.is_default) || items[0];
        if (preferred) setSelectedAddressId(preferred.id);
      })
      .catch(() => { if (active) setAddressesError('Could not load saved addresses. Check your connection and try again.'); })
      .finally(() => { if (active) setAddressesLoading(false); });
    return () => { active = false; };
  }, [selectedAddress?.id, setSelectedAddress, addressLoadAttempt, refreshServices]));

  useEffect(() => {
    let active = true;
    api.getProfile().then((profile) => { if (active) setPhone(profile?.phone || ''); });
    return () => { active = false; };
  }, []);
  useEffect(() => { setPhone(user.phone || ''); }, [user.phone]);

  if (servicesLoading) return <Screen><Header title="Book a service" onBack={() => navigation.goBack()} /><View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={colors.teal} /></View></Screen>;
  if (!s) return <Screen><Header title="Service unavailable" onBack={() => navigation.goBack()} /><View style={{ padding: 20 }}><ThemedText style={{ color: colors.muted }}>This service is no longer available.</ThemedText></View></Screen>;

  const bookingAddress = addresses.find((item) => item.id === selectedAddressId);
  const hasPhone = String(phone || '').replace(/\D/g, '').length >= 10;
  // const saveBookingPhone = () => {
  //   if (!hasPhone) {
  //     Alert.alert('Enter a valid contact number', 'Add at least 10 digits, then save the booking contact number.');
  //     return;
  //   }
  //   setEditingPhone(false);
  // };
  
  //with save button
//  const saveBookingPhone = async () => {
//   if (!hasPhone) {
//     Alert.alert(
//       'Enter a valid contact number',
//       'Add at least 10 digits, then save the booking contact number.'
//     );
//     return;
//   }

//   try {
//     const profile = await api.getProfile();

//     await api.saveProfile({
//       fullName: profile?.full_name || user.name || 'Customer',
//       phone: phone.trim(),
//     });

//     setEditingPhone(false);
//   } catch (error) {
//     Alert.alert(
//       'Could not save phone',
//       error?.message || 'Please try again.'
//     );
//   }
// };

const saveBookingPhone = () => {
  if (!hasPhone) {
    Alert.alert(
      'Enter a valid contact number',
      'Add at least 10 digits, then continue.'
    );
    return;
  }

  setEditingPhone(false);
};
  const scheduleIsValid = Number.isFinite(schedule.getTime()) && schedule.getTime() > Date.now();
  const onDateChange = (_event, value) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (value) setSchedule((current) => {
      const next = new Date(current);
      next.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
      return next;
    });
  };
  const onTimeChange = (_event, value) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (value) setSchedule((current) => {
      const next = new Date(current);
      next.setHours(value.getHours(), value.getMinutes(), 0, 0);
      return next;
    });
  };
  const confirmBooking = async () => {
    if (continueRef.current || creatingBooking) return;
    if (!scheduleIsValid) return Alert.alert('Choose a future time', 'The selected date and time have already passed. Please choose a future time.');
    if (!bookingAddress) return Alert.alert('Choose an address', 'Please add or select a saved address before booking.');
    if (!hasPhone) return navigation.navigate('AddPhone');
    continueRef.current = true;
    setCreatingBooking(true);
    try {
      const result = await api.createBooking({ serviceId: s.id, date: dateToISO(schedule), time: formatTime(schedule), note, addressId: bookingAddress.id, phone, photos, clientRequestId: clientRequestIdRef.current });
      addBooking(result);
      navigation.reset({ index: 1, routes: [{ name: 'Main' }, { name: 'BookingConfirmed', params: { id: result.id, service: result.service, when: result.when, address: result.address, startingPrice: s.price, photoUploadError: result.photoUploadError } }] });
    } catch (error) {
      continueRef.current = false;
      Alert.alert('Booking failed', error?.message || 'We could not create your booking. Please try again.');
    } finally {
      setCreatingBooking(false);
    }
  };
  const pickPhotos = async () => {
    if (pickingPhotos || photos.length >= 3) return;
    setPickingPhotos(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo access to attach images, or continue without photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 3 - photos.length,
        quality: 0.8, exif: false,
      });
      if (result.canceled) return;
      const chosen = (result.assets || []).filter((asset) => !asset.mimeType || asset.mimeType.startsWith('image/'))
        .map((asset) => ({ ...asset, mimeType: asset.mimeType || 'image/jpeg' }));
      const oversized = chosen.some((asset) => asset.fileSize && asset.fileSize > 8 * 1024 * 1024);
      if (oversized) {
        Alert.alert('Image is too large', 'Choose images smaller than 8 MB each.');
      }
      const acceptable = chosen.filter((asset) => !asset.fileSize || asset.fileSize <= 8 * 1024 * 1024);
      setPhotos((current) => [...current, ...acceptable.filter((asset) => !current.some((item) => item.uri === asset.uri))].slice(0, 3));
      if (chosen.length !== (result.assets || []).length) Alert.alert('Unsupported image', 'Some selected files could not be added. Choose an image file.');
    } catch {
      Alert.alert('Could not open photos', 'The photo picker failed. Please try again.');
    } finally { setPickingPhotos(false); }
  };
  return (
    <Screen>
      <Header title="Book a service" onBack={() => navigation.goBack()} />
        <KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <FadeIn>
          <View style={{ backgroundColor: colors.tealSoft, borderRadius: radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
            <IconBox name={s.icon} size={64} tint="#fff" />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>{s.name}</ThemedText>
              <ThemedText style={{ color: colors.teal, fontWeight: '700', fontSize: 17, marginTop: 4 }}>Starting from ₹{s.price}</ThemedText>
            </View>
            <ThemedText style={{ backgroundColor: colors.orangeSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontWeight: '700' }}>{s.rating}</ThemedText>
          </View>
          <View style={{ backgroundColor: colors.orange, borderRadius: radius.md, padding: 14, marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <ThemedText style={{ color: '#fff', fontWeight: '800' }}>Same-day expert visit • 20% off today</ThemedText>
            <Ionicons name="sparkles" size={24} color="#FFD34D" />
          </View>
        </FadeIn>

        <ThemedText style={[styles.h2, { color: colors.text, marginTop: 22, marginBottom: 10, fontSize: 16 }]}>Choose date</ThemedText>
        <Press onPress={() => setShowDatePicker(true)} style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border }}>
          <ThemedText style={{ fontSize: 16, color: colors.text }}>{formatDate(schedule)}</ThemedText>
          <Ionicons name="calendar-outline" size={22} color={colors.teal} />
        </Press>
        {showDatePicker && <DateTimePicker value={schedule} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} minimumDate={new Date(new Date().setHours(0, 0, 0, 0))} onChange={onDateChange} />}
        {showDatePicker && Platform.OS === 'ios' && <Button title="Done" variant="white" style={{ marginTop: 8 }} onPress={() => setShowDatePicker(false)} />}

        <ThemedText style={[styles.h2, { color: colors.text, marginTop: 22, marginBottom: 10, fontSize: 16 }]}>Choose time</ThemedText>
        <Press onPress={() => setShowTimePicker(true)} style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border }}>
          <ThemedText style={{ fontSize: 16, color: colors.text }}>{formatTime(schedule)}</ThemedText>
          <Ionicons name="time-outline" size={22} color={colors.teal} />
        </Press>
        {showTimePicker && <DateTimePicker value={schedule} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onTimeChange} />}
        {showTimePicker && Platform.OS === 'ios' && <Button title="Done" variant="white" style={{ marginTop: 8 }} onPress={() => setShowTimePicker(false)} />}

        <ThemedText style={[styles.h2, { color: colors.text, marginTop: 22, marginBottom: 10, fontSize: 16 }]}>Choose saved address</ThemedText>
        {addressesLoading ? <ActivityIndicator color={colors.teal} style={{ marginVertical: 16 }} /> : addressesError ?
          <Card><ThemedText style={{ color: colors.muted }}>{addressesError}</ThemedText><Press onPress={() => setAddressLoadAttempt((current) => current + 1)} style={{ paddingTop: 10 }}><ThemedText style={{ color: colors.teal, fontWeight: '700' }}>Try again</ThemedText></Press></Card> : addresses.length === 0 ?
          <Card>
            <ThemedText style={{ color: colors.muted }}>No saved addresses found. Save an address to continue. Current GPS location alone cannot be used for a booking.</ThemedText>
            <Press onPress={() => navigation.navigate('Addresses')} style={{ paddingTop: 12 }}><ThemedText style={{ color: colors.teal, fontWeight: '700' }}>+ Add Address</ThemedText></Press>
          </Card> :
          addresses.map((item) => {
            const isSelected = item.id === selectedAddressId;
            return <Press key={item.id} onPress={() => { setSelectedAddressId(item.id); setSelectedAddress(item); }} style={{ backgroundColor: isSelected ? colors.tealSoft : '#fff', borderRadius: radius.lg, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: isSelected ? colors.teal : colors.border }}>
              <Ionicons name={isSelected ? 'radio-button-on' : 'radio-button-off'} size={22} color={colors.teal} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={{ fontWeight: '700', fontSize: 16 }}>{item.label || 'Saved address'}{item.is_default ? ' · Default' : ''}</ThemedText>
                <ThemedText style={{ color: colors.muted, marginTop: 4 }}>{addressText(item)}</ThemedText>
              </View>
            </Press>;
          })}

        <ThemedText style={[styles.h2, { color: colors.text, marginTop: 18, marginBottom: 10, fontSize: 16 }]}>Contact number</ThemedText>
        <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {editingPhone ? <ThemedTextInput autoFocus value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Enter a contact number" style={{ flex: 1, color: colors.text, fontWeight: '700', paddingVertical: 6 }} />
            : <ThemedText style={{ flex: 1, color: phone ? colors.text : colors.muted, fontWeight: '700', paddingVertical: 6 }}>{phone || 'Add a contact number'}</ThemedText>}
          {/* <Press accessibilityRole="button" accessibilityLabel={editingPhone ? 'Save booking contact number' : 'Edit booking contact number'} onPress={editingPhone ? saveBookingPhone : () => setEditingPhone(true)} style={{ marginLeft: 12, paddingVertical: 8, paddingHorizontal: 12 }}>
            <ThemedText style={{ color: colors.teal, fontWeight: '700' }}>{editingPhone ? 'Save' : 'Edit'}</ThemedText>
          </Press> */}
          <Press
  accessibilityRole="button"
  accessibilityLabel="Edit booking contact number"
  onPress={() => {
    if (editingPhone) {
      saveBookingPhone();
    } else {
      setEditingPhone(true);
    }
  }}
  style={{ marginLeft: 12, paddingVertical: 8, paddingHorizontal: 12 }}
>
  <ThemedText style={{ color: colors.teal, fontWeight: '700' }}>
    Edit
  </ThemedText>
</Press>
        </Card>

        <View style={{ backgroundColor: colors.tealSoft, borderRadius: radius.lg, padding: 16, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="camera-outline" size={22} color={colors.teal} />
            <ThemedText style={{ fontWeight: '700', fontSize: 16, marginLeft: 10 }}>Add photos (optional)</ThemedText>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            {[0, 1, 2].map((i) => photos[i] ? (
              <View key={photos[i].uri} style={{ width: 72, height: 72, borderRadius: 12, marginRight: 10 }}>
                <Image source={{ uri: photos[i].uri }} style={{ width: 72, height: 72, borderRadius: 12 }} />
                <Press accessibilityLabel="Remove photo" onPress={() => setPhotos((current) => current.filter((_, index) => index !== i))} style={{ position: 'absolute', right: -6, top: -6, backgroundColor: colors.surface, width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close-circle" size={24} color="#B33B32" />
                </Press>
              </View>
            ) : (
              <Press key={`empty-${i}`} disabled={pickingPhotos || i !== photos.length} onPress={pickPhotos} style={{ width: 72, height: 72, borderRadius: 12, backgroundColor: colors.surface, marginRight: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.teal, opacity: i === photos.length ? 1 : 0.45 }}>
                {pickingPhotos && i === photos.length ? <ActivityIndicator color={colors.teal} /> : <Ionicons name="add" size={22} color={colors.teal} />}
              </Press>
            ))}
          </View>
          <ThemedText style={{ color: colors.muted, marginTop: 10 }}>{photos.length}/3 photos · Help the technician understand the issue</ThemedText>
        </View>

        <ThemedTextInput underlineColorAndroid="transparent" value={note} onChangeText={setNote} placeholder="Tell us anything else" placeholderTextColor={colors.muted}
          style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, marginTop: 16, fontSize: 16 }} />
        {!scheduleIsValid && <ThemedText style={{ color: '#B33B32', marginTop: 12 }}>Choose a future date and time to continue.</ThemedText>}
        <View style={{ backgroundColor: colors.tealSoft, borderRadius: radius.lg, padding: 15, marginTop: 18 }}>
          <ThemedText style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>Starting from ₹{Number(s.price || 0).toLocaleString('en-IN')}</ThemedText>
          <ThemedText style={{ color: colors.muted, marginTop: 5, lineHeight: 20 }}>The final amount is decided by the technician after inspection and confirmation with you.</ThemedText>
        </View>
        <Button title={creatingBooking ? "Creating booking…" : "Confirm booking"} variant="teal" style={{ marginTop: 18 }}
          disabled={addressesLoading || creatingBooking || !bookingAddress || !hasPhone || !scheduleIsValid} onPress={confirmBooking} />
      </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
