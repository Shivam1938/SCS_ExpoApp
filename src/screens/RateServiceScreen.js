import React, { useRef, useState } from 'react';
import { Animated, ScrollView, View, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Button, Card, Press, ThemedText, ThemedTextInput } from '../components/ui';
import { colors, radius } from '../theme';
import { api } from '../services/api';

const tagList = ['On time', 'Professional', 'Clean work', 'Good value'];

function Star({ on, onPress }) {
  const s = useRef(new Animated.Value(1)).current;
  const tap = () => {
    onPress();
    Animated.sequence([Animated.timing(s, { toValue: 1.4, duration: 120, useNativeDriver: true }), Animated.spring(s, { toValue: 1, useNativeDriver: true })]).start();
  };
  return (
    <Pressable onPress={tap} hitSlop={6}>
      <Animated.View style={{ transform: [{ scale: s }] }}>
        <Ionicons name={on ? 'star' : 'star-outline'} size={38} color={on ? colors.star : colors.text} />
      </Animated.View>
    </Pressable>
  );
}

export default function RateServiceScreen({ navigation, route }) {
  const booking = route.params?.booking;
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [tags, setTags] = useState([]);
  const toggle = (t) => setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  const submit = async () => {
    const r = await api.submitReview({ bookingId: booking?.dbId, technicianId: booking?.technicianId, rating, text, tags });
    if (!r.ok) return Alert.alert('Review not submitted', 'You can review a service after it has been completed.');
    Alert.alert('Thanks!', 'Your review has been submitted.', [{ text: 'OK', onPress: () => navigation.navigate('Main') }]);
  };
  return (
    <Screen>
      <Header title="Rate your service" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: colors.tealSoft, borderRadius: radius.lg, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>{booking?.service || 'Service'}</ThemedText>
            <ThemedText style={{ color: colors.muted, marginTop: 4 }}>Completed by {booking?.technician?.name || 'your technician'}</ThemedText>
          </View>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#2A3640', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person" size={22} color="#fff" />
          </View>
        </View>
        <ThemedText style={{ fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 40 }}>How was your experience?</ThemedText>
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 28 }}>
          {[1, 2, 3, 4, 5].map((n) => <Star key={n} on={n <= rating} onPress={() => setRating(n)} />)}
        </View>
        <ThemedText style={{ textAlign: 'center', color: colors.muted, marginTop: 22, fontSize: 16 }}>Your feedback helps local pros shine.</ThemedText>
        <ThemedText style={{ marginTop: 30, marginBottom: 8, fontSize: 16 }}>Tell us more</ThemedText>
        <ThemedTextInput underlineColorAndroid="transparent" value={text} onChangeText={setText} multiline placeholder="Share your feedback (optional)" placeholderTextColor={colors.muted}
          style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, height: 130, textAlignVertical: 'top', fontSize: 16 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 }}>
          {tagList.map((t) => {
            const on = tags.includes(t);
            return (
              <Press key={t} onPress={() => toggle(t)} style={{ backgroundColor: on ? colors.orangeSoft : '#fff', borderColor: on ? colors.orange : 'transparent', borderWidth: 1, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginRight: 10, marginBottom: 10 }}>
                <ThemedText style={{ fontSize: 16 }}>{t}</ThemedText>
              </Press>
            );
          })}
        </View>
        <Button title="Submit review" disabled={rating === 0} onPress={submit} style={{ marginTop: 30 }} />
      </ScrollView>
    </Screen>
  );
}
