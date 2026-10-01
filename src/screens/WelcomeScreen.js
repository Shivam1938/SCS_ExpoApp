import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Logo, Button, FadeIn, Card, ThemedText } from '../components/ui';
import { colors, radius } from '../theme';

export default function WelcomeScreen({ navigation }) {
  return (
    <Screen>
      <FadeIn y={0} style={{ flex: 1, padding: 22 }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <Logo size={36} />
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.orangeSoft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, marginTop: 22 }}>
              <Ionicons name="sparkles-outline" size={16} color={colors.orange} />
              <ThemedText style={{ color: colors.orange, fontWeight: '800', marginLeft: 6 }}>Professional service at your doorstep</ThemedText>
            </View>
            <ThemedText style={{ color: colors.text, fontSize: 34, lineHeight: 40, fontWeight: '900', textAlign: 'center', marginTop: 18 }}>Service made simple.</ThemedText>
            <ThemedText style={{ color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 10, textAlign: 'center', maxWidth: 340 }}>Book a service, get matched with a technician, track the job and see the final price after inspection.</ThemedText>
          </View>
          <Card style={{ marginTop: 28, padding: 16 }}>
            {[
              ['calendar-outline', 'Book when it suits you'],
              ['location-outline', 'Track your service journey'],
              ['shield-checkmark-outline', 'Final charges after inspection'],
            ].map(([icon, label]) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 7 }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={icon} size={20} color={colors.teal} />
                </View>
                <ThemedText style={{ color: colors.text, fontWeight: '700', marginLeft: 12, flex: 1 }}>{label}</ThemedText>
              </View>
            ))}
          </Card>
        </View>
        <Button title="Get Started" icon="arrow-forward" onPress={() => navigation.navigate('RoleSelection')} />
        <ThemedText style={{ color: colors.muted, textAlign: 'center', marginTop: 12, fontSize: 12 }}>Sunshine Computer Solution · SCS</ThemedText>
      </FadeIn>
    </Screen>
  );
}
