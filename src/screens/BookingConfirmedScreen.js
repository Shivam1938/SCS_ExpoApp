import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Button, FadeIn, ThemedText } from '../components/ui';
import { colors, radius } from '../theme';

export default function BookingConfirmedScreen({ navigation, route }) {
  const { id, service, when, address, photoUploadError } = route.params || {};
  const pop = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 12,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, []);

  const goToTab = (screen) => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { screen } }],
    });
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 28,
          flexGrow: 1,
          justifyContent: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center' }}>
          <Animated.View style={{ transform: [{ scale: pop }] }}>
            <View
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                backgroundColor: colors.teal,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="checkmark" size={52} color="#fff" />
            </View>
          </Animated.View>

          <FadeIn delay={250} style={{ alignItems: 'center' }}>
            <ThemedText
              style={{
                fontSize: 28,
                lineHeight: 34,
                fontWeight: '900',
                marginTop: 20,
                color: colors.text,
                textAlign: 'center',
              }}
            >
              Booking confirmed!
            </ThemedText>
            <ThemedText
              style={{
                color: colors.muted,
                fontSize: 15,
                lineHeight: 22,
                marginTop: 8,
                textAlign: 'center',
                maxWidth: 350,
              }}
            >
              We are finding an available technician for you. You will be notified when one accepts the job.
            </ThemedText>
          </FadeIn>
        </View>

        <FadeIn delay={400}>
          {photoUploadError ? (
            <View
              style={{
                backgroundColor: colors.orangeSoft,
                borderRadius: radius.md,
                padding: 12,
                marginTop: 18,
              }}
            >
              <ThemedText style={{ color: colors.text, lineHeight: 20 }}>
                {photoUploadError}
              </ThemedText>
            </View>
          ) : null}

          <Card style={{ marginTop: 18, padding: 16 }}>
            <ThemedText style={{ fontSize: 19, fontWeight: '900' }}>
              {service}
            </ThemedText>
            <ThemedText style={{ color: colors.muted, marginTop: 8 }}>
              {when}
            </ThemedText>
            <ThemedText style={{ color: colors.muted, marginTop: 6, lineHeight: 21 }}>
              {address || 'Service address saved'}
            </ThemedText>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 14,
                backgroundColor: colors.tealSoft,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 9,
                alignSelf: 'flex-start',
              }}
            >
              <Animated.View
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  backgroundColor: colors.teal,
                  marginRight: 8,
                  transform: [{ scale: pulse }],
                }}
              />
              <ThemedText style={{ color: colors.teal, fontWeight: '800' }}>
                Finding technician
              </ThemedText>
            </View>

            <View
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <ThemedText style={{ color: colors.muted }}>Booking ID</ThemedText>
              <ThemedText style={{ fontWeight: '800', flexShrink: 1, marginLeft: 12 }}>
                {id}
              </ThemedText>
            </View>
          </Card>

          <Button
            title="Track booking"
            style={{ marginTop: 18 }}
            onPress={() => navigation.navigate('TrackBooking', { id })}
          />

          <Button
            title="Go to bookings"
            variant="outline"
            style={{ marginTop: 10 }}
            onPress={() => goToTab('Bookings')}
          />

          <Button
            title="Back to home"
            variant="outline"
            style={{ marginTop: 10 }}
            onPress={() => goToTab('Home')}
          />
        </FadeIn>
      </ScrollView>
    </Screen>
  );
}
