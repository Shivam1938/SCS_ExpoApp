import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { colors, radius } from '../theme';
import { Screen, Card, Press } from '../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function AdminPanelScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId, newStatus) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", `Booking status updated to ${newStatus}`);
      fetchAllBookings();
    }
  };

  return (
    <Screen edges={['top']} style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 20, flex: 1 }}>
        <Text style={styles.header}>Admin Dashboard</Text>
        <Text style={styles.muted}>Manage all customer service requests and update statuses.</Text>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.teal} />
          </View>
        ) : bookings.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="construct-outline" size={50} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 10, fontSize: 16 }}>No service requests found!</Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ marginTop: 15 }}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.userIdText}>User ID: {item.user_id}</Text>
                  <Text style={[styles.statusBadge, { color: item.status === 'Pending' ? colors.orange : colors.teal }]}>
                    {item.status}
                  </Text>
                </View>

                <Text style={styles.dateText}>
                  <Ionicons name="calendar-outline" size={14} /> {new Date(item.booking_date).toLocaleString()}
                </Text>

                <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Press 
                    onPress={() => updateStatus(item.id, 'Technician Assigned')}
                    style={[styles.actionBtn, { backgroundColor: colors.teal }]}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Assign Tech</Text>
                  </Press>

                  <Press 
                    onPress={() => updateStatus(item.id, 'Completed')}
                    style={[styles.actionBtn, { backgroundColor: '#2A3640' }]}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Complete</Text>
                  </Press>
                </View>
              </Card>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  muted: { color: colors.muted, fontSize: 14, marginBottom: 10 },
  card: { padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#E6ECEE' },
  userIdText: { fontSize: 15, fontWeight: '700', color: colors.text },
  statusBadge: { fontSize: 12, fontWeight: '800' },
  dateText: { fontSize: 13, color: colors.muted, marginTop: 4 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm, flex: 0.48, alignItems: 'center' }
});