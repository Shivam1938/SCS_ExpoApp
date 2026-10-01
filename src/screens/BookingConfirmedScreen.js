import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Button, FadeIn, Pill, ThemedText } from '../components/ui';
import { colors } from '../theme';

export default function BookingConfirmedScreen({ navigation, route }) {
  const { id, service, when, address, photoUploadError } = route.params;
  const pop = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, bounciness: 14 }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.25, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Screen style={{ padding: 24, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center' }}>
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={68} color="#fff" />
          </View>
        </Animated.View>
        <FadeIn delay={300} style={{ alignItems: 'center' }}>
          <ThemedText style={{ fontSize: 30, fontWeight: '800', marginTop: 28, color: colors.text }}>Booking confirmed!</ThemedText>
          <ThemedText style={{ color: colors.muted, fontSize: 16, marginTop: 8, textAlign: 'center' }}>We're finding an available technician for you. You will be notified when one accepts the job.</ThemedText>
        </FadeIn>
      </View>
      <FadeIn delay={450}>
        {photoUploadError ? <View style={{ backgroundColor: colors.orangeSoft, borderRadius: 12, padding: 12, marginTop: 22 }}><ThemedText style={{ color: colors.text }}>{photoUploadError}</ThemedText></View> : null}
        <Card style={{ marginTop: 30 }}>
          <ThemedText style={{ fontSize: 20, fontWeight: '800' }}>{service}</ThemedText>
          <ThemedText style={{ color: colors.muted, marginTop: 10, fontSize: 16 }}>{when}</ThemedText>
          <ThemedText style={{ color: colors.muted, marginTop: 10, fontSize: 16 }}>{address || 'Service address saved'}</ThemedText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <ThemedText style={{ color: colors.muted }}>Booking ID</ThemedText><ThemedText style={{ fontWeight: '600' }}>{id}</ThemedText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.tealSoft, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, marginTop: 14 }}>
            <Animated.View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.teal, marginRight: 8, transform: [{ scale: pulse }] }} />
            <ThemedText style={{ color: colors.teal, fontWeight: '600' }}>Finding technician</ThemedText>
          </View>
          <View style={{ backgroundColor: colors.tealSoft, borderRadius: 12, padding: 12, marginTop: 12, alignItems: 'center' }}>
            <ThemedText style={{ fontWeight: '700' }}>Priority matching enabled</ThemedText>
          </View>
        </Card>
        <Button title="Track booking" style={{ marginTop: 24 }} onPress={() => navigation.navigate('TrackBooking', { id })} />
        <Button title="Go to bookings" variant="outline" style={{ marginTop: 12 }} onPress={() => navigation.navigate('Main', { screen: 'Bookings' })} />
        <Button title="Back to home" variant="outline" style={{ marginTop: 12 }} onPress={() => navigation.navigate('Main', { screen: 'Home' })} />
      </FadeIn>
    </Screen>
  );
}
