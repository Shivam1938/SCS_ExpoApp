import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, Press, ThemedText } from '../components/ui';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const addressText = (item) => [item.line, item.city, item.pincode].filter(Boolean).join(', ');

export default function AddressesScreen({ navigation }) {
  const { selectedAddress, setSelectedAddress } = useApp();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setAddresses(await api.getAddresses()); }
    catch { setError('Could not load saved addresses. Check your connection and try again.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const select = (item) => {
    setSelectedAddress(item);
    navigation.goBack();
  };
  const useCurrentLocation = async () => {
    setLocationLoading(true); setError('');
    try {
      const location = await api.getCurrentAddress();
      navigation.navigate('AddAddress', { location, selectAfterSave: true, makeDefault: addresses.length === 0 });
    } catch (e) { setError(e.message || 'Could not get your current location. Please enter your address manually.'); }
    finally { setLocationLoading(false); }
  };
  const makeDefault = async (item) => {
    try { await api.setDefaultAddress(item.id); await load(); }
    catch { setError('Could not set the default address. Check your connection and try again.'); }
  };
  const remove = (item) => Alert.alert('Delete address?', `Remove ${item.label || 'this address'} from your saved addresses?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try {
        await api.deleteAddress(item.id);
        if (selectedAddress?.id === item.id) setSelectedAddress(null);
        const remaining = addresses.filter((address) => address.id !== item.id);
        if (item.is_default && remaining.length) await api.setDefaultAddress(remaining[0].id);
        await load();
      }
      catch { setError('Could not delete this address. Check your connection and try again.'); await load(); }
    } },
  ]);

  return (
    <Screen>
      <Header title="Saved addresses" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <ThemedText style={{ color: colors.muted, lineHeight: 22, marginBottom: 16 }}>Save and manage the places where you want service. Your current GPS location is only saved when you choose to save it.</ThemedText>
        {error ? <Card style={{ marginBottom: 14, borderColor: '#E7B9B5' }}>
          <ThemedText style={{ color: '#A83228' }}>{error}</ThemedText>
          <Press disabled={loading} onPress={load} style={{ paddingTop: 10 }}><ThemedText style={{ color: colors.teal, fontWeight: '700' }}>Try again</ThemedText></Press>
        </Card> : null}
        <Press disabled={locationLoading} onPress={useCurrentLocation} style={{ backgroundColor: colors.tealSoft, borderRadius: radius.md, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12, opacity: locationLoading ? 0.6 : 1 }}>
          {locationLoading ? <ActivityIndicator color={colors.teal} /> : <Ionicons name="navigate" size={20} color={colors.teal} />}
          <ThemedText style={{ color: colors.teal, fontWeight: '700', marginLeft: 10 }}>{locationLoading ? 'Finding your location...' : 'Find current address'}</ThemedText>
        </Press>
        <Press onPress={() => navigation.navigate('AddAddress', { makeDefault: addresses.length === 0 })} style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Ionicons name="add-circle-outline" size={21} color={colors.orange} />
          <ThemedText style={{ color: colors.orange, fontWeight: '700', marginLeft: 10 }}>Add address manually</ThemedText>
        </Press>
        <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 17, marginBottom: 12 }}>Your saved addresses</ThemedText>
        {loading ? <ActivityIndicator color={colors.teal} style={{ marginTop: 24 }} /> : error ? null : addresses.length === 0 ?
          <Card><ThemedText style={{ color: colors.muted }}>No saved addresses yet. Find your current address or add one manually.</ThemedText></Card> :
          addresses.map((item) => {
            const selected = item.id === selectedAddress?.id;
            return <Card key={item.id} style={{ marginBottom: 12, padding: 14, borderColor: selected ? colors.teal : colors.border }}>
              <Press onPress={() => select(item)} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons name={selected ? 'radio-button-on' : 'location-outline'} size={22} color={colors.teal} />
                <View style={{ flex: 1, marginLeft: 11 }}>
                  <ThemedText style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{item.label || 'Saved address'}{item.is_default ? ' · Default' : ''}</ThemedText>
                  <ThemedText style={{ color: colors.muted, marginTop: 5, lineHeight: 20 }}>{addressText(item)}</ThemedText>
                  <ThemedText style={{ color: colors.teal, fontWeight: '700', marginTop: 8 }}>{selected ? 'Selected' : 'Tap to select'}</ThemedText>
                </View>
              </Press>
              <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12, paddingTop: 10 }}>
                {!item.is_default && <Press onPress={() => makeDefault(item)} style={{ paddingVertical: 6, paddingRight: 16 }}><ThemedText style={{ color: colors.teal, fontWeight: '600' }}>Set default</ThemedText></Press>}
                <Press onPress={() => navigation.navigate('AddAddress', { address: item })} style={{ paddingVertical: 6, paddingHorizontal: 12 }}><ThemedText style={{ color: colors.teal, fontWeight: '600' }}>Edit</ThemedText></Press>
                <Press onPress={() => remove(item)} style={{ paddingVertical: 6, paddingHorizontal: 12 }}><ThemedText style={{ color: '#B33B32', fontWeight: '600' }}>Delete</ThemedText></Press>
              </View>
            </Card>;
          })}
      </ScrollView>
    </Screen>
  );
}
