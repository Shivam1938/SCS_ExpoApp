import React from 'react';
import { Text, View } from 'react-native';
import { Screen, Logo, Button, FadeIn } from '../components/ui';
import { colors } from '../theme';

export default function WelcomeScreen({ navigation }) {
  return (
    <Screen style={{ backgroundColor: '#fff' }}>
      <FadeIn y={0} style={{ flex: 1, padding: 24 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Logo size={56} />
          <Text style={{ color: colors.muted, fontSize: 17, marginTop: 14, textAlign: 'center' }}>Trusted home services, made simple</Text>
        </View>
        <Button title="Get Started" onPress={() => navigation.navigate('Login')} />
      </FadeIn>
    </Screen>
  );
}
