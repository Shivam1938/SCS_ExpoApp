import React, { useState } from 'react';
// import { FlatList, Text, TextInput, View } from 'react-native';
import { FlatList, Image, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, IconBox, Press } from '../components/ui';
import { colors, radius } from '../theme';
import { useApp } from '../context/AppContext';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function AllServicesScreen({ navigation }) {
  const [q, setQ] = useState('');
  const { services, servicesLoading, servicesError, refresh, refreshServices } = useApp();
  useFocusEffect(useCallback(() => { refreshServices(); }, [refreshServices]));
  const data = services.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Screen>
      <Header title="All services" onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 14, height: 50, borderWidth: 1, borderColor: '#E6ECEE' }}>
          <Ionicons name="search" size={20} color={colors.teal} />
          <TextInput underlineColorAndroid="transparent" value={q} onChangeText={setQ} placeholder="Search services" placeholderTextColor="#9AA3A9"
            style={{ flex: 1, marginLeft: 10, fontSize: 15, paddingVertical: 0 }} />
        </View>
      </View>
      <FlatList data={data} keyExtractor={(s) => s.id} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={servicesLoading ? null : <View style={{ alignItems: 'center', marginTop: 40 }}><Text style={{ textAlign: 'center', color: colors.muted }}>{servicesError || 'No services found'}</Text>{servicesError ? <Text onPress={refresh} style={{ color: colors.teal, marginTop: 12 }}>Try again</Text> : null}</View>}
        renderItem={({ item: s }) => (
          <Press onPress={() => navigation.navigate('ServiceDetail', { id: s.id })} style={{ marginBottom: 12 }}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
              {/* <IconBox name={s.icon} tint={s.tint} color={s.color} size={58} />
               */}
               {s.image_url ? (
  <Image
    source={{ uri: s.image_url }}
    style={{ width: 58, height: 58, borderRadius: 12 }}
    resizeMode="cover"
  />
) : (
  <IconBox name={s.icon} tint={s.tint} color={s.color} size={58} />
)}
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{s.name}</Text>
                <Text numberOfLines={2} style={{ color: colors.muted, marginTop: 3, fontSize: 13, lineHeight: 18 }}>{s.desc}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <Ionicons name="star" size={14} color={colors.star} />
                  <Text style={{ marginLeft: 4, fontWeight: '700', fontSize: 13 }}>{s.rating}</Text>
                  <Text style={{ marginLeft: 12, color: colors.orange, fontWeight: '700', fontSize: 13 }}>From ₹{s.price}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Card>
          </Press>
        )} />
    </Screen>
  );
}
