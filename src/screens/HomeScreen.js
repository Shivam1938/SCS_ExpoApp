import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Logo, Card, IconBox, Press, FadeIn, styles, ThemedText, ThemedTextInput } from '../components/ui';
import { colors, radius } from '../theme';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

const addressText = (item) => [item.line, item.city].filter(Boolean).join(', ');

export default function HomeScreen({ navigation }) {
    const [homeBannerUrl, setHomeBannerUrl] = useState(null);
      useEffect(() => {
    let active = true;

    api.getHomeBanner()
      .then((url) => {
        if (active) setHomeBannerUrl(url);
      })
      .catch(() => {
        if (active) setHomeBannerUrl(null);
      });

    return () => {
      active = false;
    };
  }, []);
  const { user, selectedAddress, setSelectedAddress, services, servicesLoading, refreshServices, refreshProfile } = useApp();
  const [q, setQ] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [gpsAddress, setGpsAddress] = useState(null);
  const [addressError, setAddressError] = useState('');
  const addressSetupOpened = useRef(false);
  useFocusEffect(useCallback(() => { refreshServices(); refreshProfile().catch((error) => console.warn('profile refresh failed', error?.message)); }, [refreshServices, refreshProfile]));
  const locationLabel = selectedAddress ? addressText(selectedAddress) : user.city || 'Add your location';
  useEffect(() => {
    if (addressSetupOpened.current) return;
    addressSetupOpened.current = true;
    let active = true;
    api.getAddresses().then((items) => {
      if (!active) return;
      setAddresses(items);
      const currentIsSaved = selectedAddress && items.some((item) => item.id === selectedAddress.id);
      const preferred = currentIsSaved ? selectedAddress : items.find((item) => item.is_default) || items[0];
      if (preferred) {
        setSelectedAddress(preferred);
      } else {
        navigation.navigate('Addresses', { setup: true });
      }
    }).catch((error) => {
      if (active) Alert.alert('Could not load saved addresses', 'Check your connection and try again.');
    });
    return () => { active = false; };
  }, [navigation, selectedAddress, setSelectedAddress]);
  useEffect(() => {
    if (!locationOpen) return;
    let active = true;
    setAddressesLoading(true);
    setAddressError('');
    api.getAddresses().then((items) => {
      if (active) setAddresses(items);
    }).catch(() => {
      if (active) setAddressError('Could not load saved addresses. Check your connection and try again.');
    }).finally(() => { if (active) setAddressesLoading(false); });
    return () => { active = false; };
  }, [locationOpen]);
  const chooseAddress = (item) => {
    setSelectedAddress(item);
    setLocationOpen(false);
  };
  const chooseCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const item = await api.getCurrentAddress();
      setGpsAddress(item);
    } catch (error) {
      Alert.alert('Could not get your location', error.message || 'Location is unavailable. You can choose a saved address or add one manually.');
    } finally { setLocationLoading(false); }
  };
  const open = (id) => navigation.navigate('ServiceDetail', { id });
  const term = q.trim().toLowerCase();
  const list = term ? services.filter((s) => s.name.toLowerCase().includes(term)) : services.slice(0, 6);
  const popular = services.slice(0, 2).map((service) => ({ ...service, serviceId: service.id }));
  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" stickyHeaderIndices={[1]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Press onPress={() => setLocationOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Logo size={22} />
            <Ionicons name="location-outline" size={16} color={colors.orange} style={{ marginLeft: 10 }} />
            <ThemedText numberOfLines={1} style={{ color: colors.muted, marginLeft: 3, flexShrink: 1 }}>{locationLabel}</ThemedText>
          </Press>
          <Press onPress={() => navigation.navigate('Profile')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#2A3640', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={{ width: 44, height: 44 }} /> : <ThemedText style={{ color: '#fff', fontWeight: '700' }}>{user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</ThemedText>}
          </Press>
        </View>

        {/* <FadeIn>
          <ThemedText style={[styles.h1, { color: colors.text, marginTop: 20 }]}>Hi {user.name.split(' ')[0]}</ThemedText>
        </FadeIn> */}

        <View style={{ backgroundColor: colors.bg, paddingBottom: 8, zIndex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 14, height: 52, marginTop: 16, borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name="search" size={20} color={colors.teal} />
            <ThemedTextInput underlineColorAndroid="transparent" value={q} onChangeText={setQ} placeholder="Search computer, CCTV, laptop..."
              placeholderTextColor={colors.muted} style={{ flex: 1, marginLeft: 10, fontSize: 15, paddingVertical: 0 }} />
            {q ? <Ionicons name="close-circle" size={18} color="#9AA3A9" onPress={() => setQ('')} /> : null}
          </View>
        </View>

        {/* {!term && (
          <FadeIn delay={100}>
            <View style={{ backgroundColor: colors.orange, borderRadius: radius.lg, padding: 18, marginTop: 18, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <ThemedText style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>Expert help at your doorstep</ThemedText>
                <ThemedText style={{ color: '#FFE3D0', marginTop: 6, marginBottom: 12 }}>Fast, verified technicians</ThemedText>
                <Press onPress={() => navigation.navigate('AllServices')} style={{ backgroundColor: colors.surface, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, alignSelf: 'flex-start' }}>
                  <ThemedText style={{ color: colors.orange, fontWeight: '700' }}>View services</ThemedText>
                </Press>
              </View>
              <View style={{ width: 92, height: 112, borderRadius: 16, backgroundColor: '#1F2A33', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="desktop-outline" size={44} color="#FFB380" />
              </View>
            </View>
          </FadeIn>
        )} */}
        {!term && (
  <FadeIn delay={100}>
    <Press
      onPress={() => navigation.navigate('AllServices')}
      style={{
        marginTop: 18,
        height: 160,
        borderRadius: radius.lg,
        overflow: 'hidden',
        backgroundColor: colors.orange,
      }}
    >
      {homeBannerUrl ? (
        <Image
          source={{ uri: homeBannerUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            flex: 1,
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <ThemedText
              style={{
                color: '#fff',
                fontSize: 20,
                fontWeight: '800',
              }}
            >
              Expert help at your doorstep
            </ThemedText>

            <ThemedText
              style={{
                color: '#FFE3D0',
                marginTop: 6,
                marginBottom: 12,
              }}
            >
              Fast, verified technicians
            </ThemedText>

            <View
              style={{
                backgroundColor: colors.surface,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 999,
                alignSelf: 'flex-start',
              }}
            >
              <ThemedText style={{ color: colors.orange, fontWeight: '700' }}>
                View services
              </ThemedText>
            </View>
          </View>

          <View
            style={{
              width: 92,
              height: 112,
              borderRadius: 16,
              backgroundColor: '#1F2A33',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="desktop-outline" size={44} color="#FFB380" />
          </View>
        </View>
      )}
    </Press>
  </FadeIn>
)}

        <ThemedText style={[styles.h2, { color: colors.text, marginTop: 24, marginBottom: 12 }]}>{term ? 'Results' : 'Book a service'}</ThemedText>
        {servicesLoading && <ActivityIndicator color={colors.teal} style={{ marginVertical: 20 }} />}
        {!servicesLoading && list.length === 0 && <ThemedText style={{ color: colors.muted, textAlign: 'center', marginVertical: 20 }}>{term ? `No services found for "${q}"` : 'No services are available right now.'}</ThemedText>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {list.map((s, i) => (
            <FadeIn key={s.id} delay={150 + i * 60} style={{ width: '48%', marginBottom: 12 }}>
              <Press onPress={() => open(s.id)}>
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                  {/* <View style={{ height: 84, backgroundColor: s.tint, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={s.icon} size={38} color={s.color} />
                  </View> */}
                  <View style={{ height: 84, backgroundColor: s.tint, alignItems: 'center', justifyContent: 'center' }}>
  {s.image_url ? (
    <Image
      source={{ uri: s.image_url }}
      style={{ width: '100%', height: '100%' }}
      resizeMode="cover"
    />
  ) : (
    <Ionicons name={s.icon} size={38} color={s.color} />
  )}
</View>
                  <View style={{ padding: 12 }}>
                    <ThemedText numberOfLines={1} style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{s.name}</ThemedText>
                    <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>From ₹{s.price}</ThemedText>
                  </View>
                </Card>
              </Press>
            </FadeIn>
          ))}
        </View>

        {!term && (
          <>
            <Press onPress={() => navigation.navigate('AllServices')} style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <ThemedText style={{ color: colors.teal, fontWeight: '700', fontSize: 15 }}>View all services</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={colors.teal} style={{ marginLeft: 4 }} />
            </Press>
            <ThemedText style={[styles.h2, { color: colors.text, marginTop: 26, marginBottom: 12 }]}>Popular near you</ThemedText>
            <FlatList horizontal data={popular} keyExtractor={(i) => i.id} showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <Press onPress={() => open(item.serviceId)} style={{ marginRight: 12 }}>
                  <Card style={{ width: 170 }}>
                    <IconBox name={item.icon} />
                    <ThemedText style={{ fontWeight: '700', fontSize: 16, marginTop: 14 }}>{item.name}</ThemedText>
                    <ThemedText style={{ color: colors.muted, marginTop: 4 }}>From ₹{item.price.toLocaleString('en-IN')}</ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <Ionicons name="star" size={15} color={colors.star} /><ThemedText style={{ fontWeight: '700', marginLeft: 4 }}>{item.rating}</ThemedText>
                    </View>
                  </Card>
                </Press>
              )} />
          </>
        )}
      </ScrollView>
      <Modal visible={locationOpen} transparent animationType="slide" onRequestClose={() => setLocationOpen(false)}>
        <Press onPress={() => setLocationOpen(false)} style={{ flex: 1, backgroundColor: '#0006', justifyContent: 'flex-end' }}>
          <Press onPress={() => {}} style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '78%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <ThemedText style={[styles.h2, { color: colors.text }]}>Choose a location</ThemedText>
              <Press onPress={() => setLocationOpen(false)}><Ionicons name="close" size={24} color={colors.text} /></Press>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Press disabled={locationLoading} onPress={chooseCurrentLocation} style={{ backgroundColor: colors.tealSoft, borderRadius: radius.md, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                {locationLoading ? <ActivityIndicator color={colors.teal} /> : <Ionicons name="navigate" size={20} color={colors.teal} />}
                <ThemedText style={{ color: colors.teal, fontWeight: '700', marginLeft: 10 }}>Use Current Location</ThemedText>
              </Press>
              {gpsAddress ? <Press onPress={() => chooseAddress(gpsAddress)} style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: selectedAddress?.id === gpsAddress.id ? colors.teal : colors.border }}>
                <Ionicons name={selectedAddress?.id === gpsAddress.id ? 'radio-button-on' : 'location'} size={21} color={colors.teal} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <ThemedText style={{ color: colors.text, fontWeight: '700' }}>Current location</ThemedText>
                  <ThemedText style={{ color: colors.muted, marginTop: 3 }}>{addressText(gpsAddress)}</ThemedText>
                </View>
              </Press> : null}
              <ThemedText style={{ color: colors.muted, fontWeight: '700', marginBottom: 10 }}>Saved addresses</ThemedText>
              {addressesLoading ? <ActivityIndicator color={colors.teal} style={{ marginVertical: 16 }} /> : addressError ?
                <ThemedText style={{ color: colors.muted, marginBottom: 12 }}>{addressError}</ThemedText> : addresses.length === 0 ?
                  <ThemedText style={{ color: colors.muted, marginBottom: 12 }}>No saved addresses yet.</ThemedText> : addresses.map((item) => (
                    <Press key={item.id} onPress={() => chooseAddress(item)} style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name={selectedAddress?.id === item.id ? 'radio-button-on' : 'location-outline'} size={21} color={colors.teal} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <ThemedText style={{ color: colors.text, fontWeight: '700' }}>{item.label || 'Saved address'}{item.is_default ? ' · Default' : ''}</ThemedText>
                        <ThemedText style={{ color: colors.muted, marginTop: 3 }}>{addressText(item)}</ThemedText>
                      </View>
                    </Press>
                  ))}
              <Press onPress={() => { setLocationOpen(false); navigation.navigate('Addresses'); }} style={{ padding: 14, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="settings-outline" size={20} color={colors.teal} />
                <ThemedText style={{ color: colors.teal, fontWeight: '700', marginLeft: 10 }}>Manage saved addresses</ThemedText>
              </Press>
              <Press onPress={() => { setLocationOpen(false); navigation.navigate('AddAddress', { makeDefault: addresses.length === 0 }); }} style={{ padding: 14, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="add-circle-outline" size={22} color={colors.orange} />
                <ThemedText style={{ color: colors.orange, fontWeight: '700', marginLeft: 10 }}>Add New Address</ThemedText>
              </Press>
            </ScrollView>
          </Press>
        </Press>
      </Modal>
    </Screen>
  );
}
