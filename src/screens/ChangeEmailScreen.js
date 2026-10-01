import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Screen, Header, Button, Card, ThemedText, ThemedTextInput } from '../components/ui';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function ChangeEmailScreen({ navigation }) {
  const { user } = useApp();
  const [email, setEmail] = useState(user.email || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail(user.email || '');
  }, [user.email]);

  const save = async () => {
    const next = email.trim().toLowerCase();
    setError('');
    if (!validEmail(next)) return setError('Enter a valid email address.');
    if (next === String(user.email || '').toLowerCase()) return setError('Enter a different email address.');
    if (saving) return;
    setSaving(true);
    try {
      await api.updateEmail(next);
      Alert.alert('Confirmation required', `A confirmation link has been sent to ${next}. Open that email to complete the change.`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      setError(e?.message || 'Could not change your email address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title="Change email" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Card>
            <ThemedText style={{ fontSize: 20, fontWeight: '800' }}>Update your email address</ThemedText>
            <ThemedText style={{ color: colors.muted, marginTop: 7, lineHeight: 21 }}>Supabase will send a confirmation link to the new address before the change is completed.</ThemedText>
            <ThemedText style={{ color: colors.text, fontWeight: '700', marginTop: 22, marginBottom: 8 }}>New email</ThemedText>
            <ThemedTextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.muted} style={{ backgroundColor: colors.input, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 15, fontSize: 16 }} />
            {error ? <ThemedText accessibilityRole="alert" style={{ color: colors.danger, marginTop: 12, lineHeight: 20 }}>{error}</ThemedText> : null}
            <Button title={saving ? 'Sending confirmation…' : 'Change email'} disabled={saving} onPress={save} style={{ marginTop: 20 }} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
