import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Screen, Header, Button, Press, ThemedText, ThemedTextInput } from '../components/ui';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const labels = ['Home', 'Work', 'Other'];

export default function AddAddressScreen({ navigation, route }) {
  const editing = route.params?.address;
  const location = route.params?.location;
  const { selectedAddress, setSelectedAddress } = useApp();
  const [label, setLabel] = useState(editing?.label || location?.label || 'Home');
  const [line, setLine] = useState(editing?.line || location?.line || '');
  const [city, setCity] = useState(editing?.city || location?.city || '');
  const [pincode, setPincode] = useState(editing?.pincode || location?.pincode || '');
  const [customLabel, setCustomLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing?.label && !labels.includes(editing.label)) { setLabel('Other'); setCustomLabel(editing.label); }
    if (location?.label && !labels.includes(location.label)) { setLabel('Other'); setCustomLabel(location.label); }
  }, [editing, location]);

  const useCurrentLocation = async () => {
    setLocating(true); setError('');
    try {
      const current = await api.getCurrentAddress();
      setLine(current.line); setCity(current.city); setPincode(current.pincode || '');
      navigation.setParams({ location: current });
    } catch (e) { setError(e.message || 'Could not get your current location. Please enter your address manually.'); }
    finally { setLocating(false); }
  };

  const save = async () => {
    if (!line.trim() || !city.trim()) { setError('Enter your address and city.'); return; }
    const addressLabel = label === 'Other' ? (customLabel.trim() || 'Other') : label;
    setSaving(true); setError('');
    try {
      const values = { label: addressLabel, line: line.trim(), city: city.trim(), pincode: pincode.trim(), latitude: location?.latitude ?? editing?.latitude, longitude: location?.longitude ?? editing?.longitude };
      const address = editing
        ? await api.updateAddress(editing.id, values)
        : await api.createAddress({ ...values, is_default: route.params?.makeDefault === true });
      if (!editing || route.params?.selectAfterSave || selectedAddress?.id === address.id) setSelectedAddress(address);
      navigation.goBack();
    } catch { setError('Could not save this address. Check your connection and try again.'); }
    finally { setSaving(false); }
  };

  return (
    <Screen>
      <Header title={editing ? 'Edit address' : 'Add new address'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {!editing && <Press disabled={locating} onPress={useCurrentLocation} style={{ backgroundColor: colors.tealSoft, borderRadius: radius.md, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          {locating ? <ActivityIndicator color={colors.teal} /> : null}
          <ThemedText style={{ color: colors.teal, fontWeight: '700', marginLeft: locating ? 10 : 0 }}>{locating ? 'Getting current address...' : 'Use current location'}</ThemedText>
        </Press>}
        <ThemedText style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}>Label</ThemedText>
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          {labels.map((item) => <Press key={item} onPress={() => setLabel(item)} style={{ marginRight: 8, paddingVertical: 9, paddingHorizontal: 15, borderRadius: 20, backgroundColor: label === item ? colors.teal : '#fff', borderWidth: 1, borderColor: label === item ? colors.teal : colors.border }}><ThemedText style={{ color: label === item ? '#fff' : colors.text, fontWeight: '600' }}>{item}</ThemedText></Press>)}
        </View>
        {label === 'Other' && <ThemedTextInput value={customLabel} onChangeText={setCustomLabel} placeholder="Custom label" style={inputStyle} />}
        <ThemedText style={{ color: colors.text, fontWeight: '700', marginTop: 16, marginBottom: 8 }}>Address</ThemedText>
        <ThemedTextInput value={line} onChangeText={setLine} placeholder="House number, street, area" multiline style={[inputStyle, { minHeight: 90, textAlignVertical: 'top' }]} />
        <ThemedText style={{ color: colors.text, fontWeight: '700', marginTop: 16, marginBottom: 8 }}>City</ThemedText>
        <ThemedTextInput value={city} onChangeText={setCity} placeholder="City" style={inputStyle} />
        <ThemedText style={{ color: colors.text, fontWeight: '700', marginTop: 16, marginBottom: 8 }}>Pincode (optional)</ThemedText>
        <ThemedTextInput value={pincode} onChangeText={setPincode} placeholder="Pincode" keyboardType="number-pad" style={inputStyle} />
        {error ? <ThemedText accessibilityRole="alert" style={{ color: '#C43D32', marginTop: 12 }}>{error}</ThemedText> : null}
        <Button title={saving ? 'Saving...' : editing ? 'Save changes' : 'Save address'} disabled={saving || locating} onPress={save} style={{ marginTop: 22 }} />
      </ScrollView></KeyboardAvoidingView>
    </Screen>
  );
}

const inputStyle = { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border };
