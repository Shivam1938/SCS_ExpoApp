import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Logo, Card, Press, FadeIn, Header, ThemedText } from '../components/ui';
import { colors, radius } from '../theme';

export default function RoleSelectionScreen({ navigation }) {
  const choose = (role) => navigation.navigate('Login', { role });
  return (
    <Screen>
      <Header title="Choose your role" onBack={() => navigation.goBack()} />
      <View style={{ flex: 1, padding: 22 }}>
        <FadeIn style={{ alignItems: 'center', marginTop: 18 }}>
          <Logo size={34} />
          <ThemedText style={{ color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 24, textAlign: 'center' }}>How will you use SCS?</ThemedText>
          <ThemedText style={{ color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8, maxWidth: 340 }}>Choose the account type you want to sign in or create.</ThemedText>
        </FadeIn>
        <View style={{ marginTop: 28, gap: 14 }}>
          <Press onPress={() => choose('customer')}>
            <Card style={{ padding: 20, flexDirection: 'row', alignItems: 'center', borderColor: colors.teal }}>
              <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="person-outline" size={30} color={colors.teal} /></View>
              <View style={{ flex: 1, marginLeft: 16 }}><ThemedText style={{ color: colors.text, fontSize: 19, fontWeight: '800' }}>Customer</ThemedText><ThemedText style={{ color: colors.muted, marginTop: 4 }}>Book services and track your technician.</ThemedText></View>
              <Ionicons name="chevron-forward" size={22} color={colors.muted} />
            </Card>
          </Press>
          <Press onPress={() => choose('technician')}>
            <Card style={{ padding: 20, flexDirection: 'row', alignItems: 'center', borderColor: colors.orange }}>
              <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: colors.orangeSoft, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="construct-outline" size={30} color={colors.orange} /></View>
              <View style={{ flex: 1, marginLeft: 16 }}><ThemedText style={{ color: colors.text, fontSize: 19, fontWeight: '800' }}>Technician</ThemedText><ThemedText style={{ color: colors.muted, marginTop: 4 }}>Accept jobs, manage work and record payments.</ThemedText></View>
              <Ionicons name="chevron-forward" size={22} color={colors.muted} />
            </Card>
          </Press>
        </View>
        <View style={{ flex: 1 }} />
        <ThemedText style={{ textAlign: 'center', color: colors.muted, fontSize: 13, marginBottom: 8 }}>Sunshine Computer Solution</ThemedText>
      </View>
    </Screen>
  );
}
