import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Button, FadeIn, Pill } from '../components/ui';
import { colors } from '../theme';

export default function BookingConfirmedScreen({ navigation, route }) {
  const { id, service, when, photoUploadError } = route.params;
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
          <Text style={{ fontSize: 30, fontWeight: '800', marginTop: 28, color: colors.text }}>Booking confirmed!</Text>
          <Text style={{ color: colors.muted, fontSize: 16, marginTop: 8 }}>We're finding the best technician for you.</Text>
        </FadeIn>
      </View>
      <FadeIn delay={450}>
        {photoUploadError ? <View style={{ backgroundColor: colors.orangeSoft, borderRadius: 12, padding: 12, marginTop: 22 }}><Text style={{ color: colors.text }}>{photoUploadError}</Text></View> : null}
        <Card style={{ marginTop: 30 }}>
          <Text style={{ fontSize: 20, fontWeight: '800' }}>{service}</Text>
          <Text style={{ color: colors.muted, marginTop: 10, fontSize: 16 }}>{when}</Text>
          <Text style={{ color: colors.muted, marginTop: 10, fontSize: 16 }}>12B, Lake View Road, Indiranagar</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={{ color: colors.muted }}>Booking ID</Text><Text style={{ fontWeight: '600' }}>{id}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.tealSoft, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, marginTop: 14 }}>
            <Animated.View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.teal, marginRight: 8, transform: [{ scale: pulse }] }} />
            <Text style={{ color: colors.teal, fontWeight: '600' }}>Finding technician</Text>
          </View>
          <View style={{ backgroundColor: colors.tealSoft, borderRadius: 12, padding: 12, marginTop: 12, alignItems: 'center' }}>
            <Text style={{ fontWeight: '700' }}>Priority matching enabled</Text>
          </View>
        </Card>
        <Button title="Track booking" style={{ marginTop: 24 }} onPress={() => navigation.navigate('TrackBooking', { id })} />
        <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 16, marginTop: 18 }} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}>Back to home</Text>
      </FadeIn>
    </Screen>
  );
}
