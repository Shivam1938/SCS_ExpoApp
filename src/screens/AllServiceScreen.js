import { ThemedText } from '../components/ui';
import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const SERVICES = [
  { id: 'computer', title: 'Computer Repair' },
  { id: 'laptop', title: 'Laptop Repair' },
];

export default function AllServicesScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>All Services</ThemedText>
      <FlatList
        data={SERVICES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ServiceDetail', { id: item.id })}
          >
            <ThemedText style={styles.cardText}>{item.title}</ThemedText>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.surface },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: { padding: 15, backgroundColor: '#f0f0f0', marginBottom: 10, borderRadius: 8 },
  cardText: { fontSize: 16, fontWeight: '600' },
});