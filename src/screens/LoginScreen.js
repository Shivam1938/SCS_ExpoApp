import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Logo, Button, FadeIn, Header, Press } from '../components/ui';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function LoginScreen({ navigation }) {
  const { refresh } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (loading) return;
    setError('');
    if (!email.trim() || !password) return setError('Enter your email and password.');
    if (!validEmail(email)) return setError('Enter a valid email address.');
    setLoading('login');
    const result = await api.signIn(email.trim().toLowerCase(), password);
    setLoading('');
    if (!result.ok) return setError(result.error);
    await refresh();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    if (result.profileWarning) Alert.alert('Signed in', 'Your account is open, but profile details could not be synced.');
  };

  const sendReset = async () => {
    if (loading) return;
    setError('');
    if (!email.trim()) return setError('Enter your email address first.');
    if (!validEmail(email)) return setError('Enter a valid email address.');
    setLoading('reset');
    const result = await api.resetPassword(email.trim().toLowerCase());
    setLoading('');
    if (!result.ok) return setError(result.error);
    Alert.alert('Check your inbox', 'If an account exists for this email, a password reset link has been sent.');
  };

  return (
    <Screen style={{ backgroundColor: '#fff' }}>
      <Header title="Sign in" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 36 }}>
          <FadeIn style={{ alignItems: 'center', marginBottom: 26 }}>
            <Logo size={30} />
            <Text style={{ fontSize: 28, fontWeight: '800', marginTop: 24, color: colors.text, textAlign: 'center' }}>Welcome back</Text>
            <Text style={{ color: colors.muted, fontSize: 16, marginTop: 8, textAlign: 'center' }}>Sign in to Sunshine Computer Solution</Text>
          </FadeIn>

          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#9AA3A9"
            autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress"
            style={{ backgroundColor: '#F4F7F8', borderRadius: radius.md, padding: 15, fontSize: 16, marginBottom: 16 }} />

          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Password</Text>
          <View style={{ backgroundColor: '#F4F7F8', borderRadius: radius.md, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' }}>
            <TextInput value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor="#9AA3A9"
              secureTextEntry={!showPassword} textContentType="password" autoCapitalize="none"
              onSubmitEditing={submit} returnKeyType="go" style={{ flex: 1, paddingVertical: 15, fontSize: 16, color: colors.text }} />
            <Press onPress={() => setShowPassword((shown) => !shown)} style={{ padding: 4 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.muted} />
            </Press>
          </View>
          <Press onPress={sendReset} disabled={!!loading} style={{ alignSelf: 'flex-end', paddingVertical: 12 }}>
            <Text style={{ color: colors.teal, fontWeight: '700' }}>{loading === 'reset' ? 'Sending reset link…' : 'Forgot password?'}</Text>
          </Press>

          {!!error && <Text accessibilityRole="alert" style={{ color: '#C0392B', marginBottom: 12, lineHeight: 20 }}>{error}</Text>}
          <Button title={loading === 'login' ? 'Signing in…' : 'Sign in'} disabled={!!loading} onPress={submit} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: colors.muted }}>New to SCS? </Text>
            <Press onPress={() => navigation.navigate('Signup')}>
              <Text style={{ color: colors.teal, fontWeight: '700' }}>Create an account</Text>
            </Press>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
