import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Logo, Button, FadeIn, Header, Press } from '../components/ui';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function SignupScreen({ navigation }) {
  const { refresh } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (loading) return;
    setError('');
    if (!name.trim() || !email.trim() || !password || !confirmPassword) return setError('Please fill in every field.');
    if (!validEmail(email)) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('The passwords do not match.');

    setLoading(true);
    const result = await api.signUp(email.trim().toLowerCase(), password, name.trim());
    setLoading(false);
    if (!result.ok) return setError(result.error);

    if (result.needsEmailConfirmation) {
      Alert.alert('Confirm your email', 'We created your account. Open the confirmation link sent to your email, then sign in.', [
        { text: 'OK', onPress: () => navigation.replace('Login') },
      ]);
      return;
    }

    await refresh();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    if (result.profileWarning) Alert.alert('Account created', 'Your account is open, but profile details could not be synced.');
  };

  const passwordField = (label, value, onChangeText, visible, toggleVisibility, isConfirm = false) => (
    <>
      <Text style={{ fontWeight: '700', marginBottom: 8 }}>{label}</Text>
      <View style={{ backgroundColor: '#F4F7F8', borderRadius: radius.md, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <TextInput value={value} onChangeText={onChangeText} placeholder={isConfirm ? 'Re-enter your password' : 'At least 8 characters'}
          placeholderTextColor="#9AA3A9" secureTextEntry={!visible} textContentType="newPassword" autoCapitalize="none"
          returnKeyType={isConfirm ? 'done' : 'next'}style={{ flex: 1, paddingVertical: 15, fontSize: 16, color: colors.text }} />
        <Press onPress={toggleVisibility} style={{ padding: 4 }}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.muted} />
        </Press>
      </View>
    </>
  );

  return (
    <Screen style={{ backgroundColor: '#fff' }}>
      <Header title="Create account" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingBottom: 36 }}>
          <FadeIn style={{ alignItems: 'center', marginBottom: 24 }}>
            <Logo size={28} />
            <Text style={{ fontSize: 27, fontWeight: '800', marginTop: 20, color: colors.text }}>Join Sunshine Computer Solution</Text>
            <Text style={{ color: colors.muted, marginTop: 8, textAlign: 'center' }}>Create an account to book and manage your services.</Text>
          </FadeIn>

          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Full name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor="#9AA3A9"
            autoCapitalize="words" textContentType="name" returnKeyType="next"
            style={{ backgroundColor: '#F4F7F8', borderRadius: radius.md, padding: 15, fontSize: 16, marginBottom: 16 }} />

          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#9AA3A9"
            autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" returnKeyType="next"
            style={{ backgroundColor: '#F4F7F8', borderRadius: radius.md, padding: 15, fontSize: 16, marginBottom: 16 }} />

          {passwordField('Password', password, setPassword, showPassword, () => setShowPassword((shown) => !shown))}
          {passwordField('Confirm password', confirmPassword, setConfirmPassword, showConfirmPassword, () => setShowConfirmPassword((shown) => !shown), true)}

          {!!error && <Text accessibilityRole="alert" style={{ color: '#C0392B', marginBottom: 12, lineHeight: 20 }}>{error}</Text>}
          <Button title={loading ? 'Creating account…' : 'Create account'} disabled={loading} onPress={submit} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 22 }}>
            <Text style={{ color: colors.muted }}>Already have an account? </Text>
            <Press onPress={() => navigation.navigate('Login')}>
              <Text style={{ color: colors.teal, fontWeight: '700' }}>Sign in</Text>
            </Press>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
