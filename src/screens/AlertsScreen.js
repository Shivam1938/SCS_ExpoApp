import React, { useState, useCallback } from 'react';
import { Alert, ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, IconBox, Press, FadeIn, styles } from '../components/ui';
import { colors, radius } from '../theme';
import { useApp } from '../context/AppContext';
import { useFocusEffect } from '@react-navigation/native';

export default function AlertsScreen({ navigation }) {
  const { user, alerts, alertsLoading, alertsError, markAllReadLoading, markingAlertId, markAlertRead, markAllRead, deleteAlert, refreshAlerts, bookings } = useApp();
  const [deletingId, setDeletingId] = useState(null);

  // Refresh alerts every time this tab becomes visible. This keeps technician
  // alerts current even when Supabase Realtime delivery is delayed or unavailable.
  useFocusEffect(useCallback(() => {
    refreshAlerts().catch(() => {});
  }, [refreshAlerts]));
  const unreadCount = alerts.filter((item) => item.unread).length;
  const confirmDelete = (alertItem) => Alert.alert('Delete alert?', 'This alert will be removed from your list.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      setDeletingId(alertItem.id);
      try { await deleteAlert(alertItem.id); }
      catch { Alert.alert('Could not delete alert', 'Check your connection and try again.'); }
      finally { setDeletingId(null); }
    } },
  ]);
  const readAlert = async (item) => {
    if (item.unread && !markingAlertId) { try { await markAlertRead(item.id); } catch {} }
    if (item.bookingId) {
      navigation.navigate(user.role === 'technician' ? 'TechnicianBookingDetails' : 'TrackBooking', { id: item.bookingId });
    }
  };

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.h1, { color: colors.text }]}>Alerts</Text>
          <Press disabled={!unreadCount || markAllReadLoading} onPress={async () => { try { await markAllRead(); } catch { /* Inline error is shown above the list. */ } }} style={{ opacity: !unreadCount || markAllReadLoading ? 0.45 : 1, padding: 6 }}>
            <Text style={{ color: colors.teal, fontWeight: '700', fontSize: 15 }}>{markAllReadLoading ? 'Updating…' : 'Mark all read'}</Text>
          </Press>
        </View>

        <View style={{ backgroundColor: colors.tealSoft, borderRadius: radius.lg, padding: 18, marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 17, fontWeight: '700' }}>Your service activity</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>{bookings.filter((b) => !['completed', 'cancelled'].includes(b.rawStatus)).length} active bookings</Text>
          </View>
          <Press onPress={() => navigation.navigate('Bookings')}><Text style={{ color: colors.teal, fontWeight: '700' }}>View bookings</Text></Press>
        </View>

        {alertsError ? <Card style={{ marginTop: 14, borderColor: '#E7B9B5' }}>
          <Text style={{ color: '#A83228', lineHeight: 20 }}>{alertsError}</Text>
          <Press disabled={alertsLoading} onPress={refreshAlerts} style={{ paddingTop: 10 }}><Text style={{ color: colors.teal, fontWeight: '700' }}>{alertsLoading ? 'Loading…' : 'Try again'}</Text></Press>
        </Card> : null}

        {alertsLoading && alerts.length === 0 ? <ActivityIndicator color={colors.teal} style={{ marginTop: 28 }} /> : null}
        {!alertsLoading && !alertsError && alerts.length === 0 ? <Card style={{ marginTop: 14, alignItems: 'center', padding: 24 }}>
          <Ionicons name="notifications-outline" size={34} color={colors.teal} />
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16, marginTop: 10 }}>No notifications yet</Text>
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 5 }}>Booking updates and other alerts will appear here.</Text>
        </Card> : null}

        {alerts.map((item, index) => <FadeIn key={item.id} delay={index * 60}>
          <Card style={{ flexDirection: 'row', marginTop: 14, alignItems: 'flex-start' }}>
            <Press disabled={!item.unread || markingAlertId !== null || deletingId !== null} onPress={() => readAlert(item)} style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start' }}>
              <IconBox name={item.icon} tint={item.tint} size={54} color={item.icon?.includes('pricetag') ? colors.orange : colors.teal} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 16, fontWeight: item.unread ? '700' : '600', color: colors.text }}>{item.title}</Text>
                <Text style={{ color: colors.muted, marginTop: 4, lineHeight: 21 }}>{item.body}</Text>
                <Text style={{ color: colors.muted, marginTop: 6 }}>{item.time}</Text>
                {item.unread ? <Text style={{ color: colors.teal, fontSize: 12, fontWeight: '700', marginTop: 6 }}>Tap to open</Text> : null}
              </View>
            </Press>
            <View style={{ alignItems: 'center', marginLeft: 5 }}>
              {markingAlertId === item.id ? <ActivityIndicator color={colors.teal} style={{ padding: 8 }} /> : item.unread ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.orange, marginTop: 12 }} /> : null}
              {deletingId === item.id ? <ActivityIndicator color={colors.muted} style={{ padding: 8 }} /> : <Press accessibilityLabel="Delete alert" onPress={() => confirmDelete(item)} disabled={deletingId !== null} style={{ padding: 8, marginTop: 6 }}>
                <Ionicons name="trash-outline" size={20} color="#D84A4A" />
              </Press>}
            </View>
          </Card>
        </FadeIn>)}
      </ScrollView>
    </Screen>
  );
}
