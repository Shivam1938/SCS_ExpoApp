import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const SERVICES = [
  { id: 'computer', title: 'Computer Repair' },
  { id: 'laptop', title: 'Laptop Repair' },
];

export default function AllServicesScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Services</Text>
      <FlatList
        data={SERVICES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ServiceDetail', { id: item.id })}
          >
            <Text style={styles.cardText}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: { padding: 15, backgroundColor: '#f0f0f0', marginBottom: 10, borderRadius: 8 },
  cardText: { fontSize: 16, fontWeight: '600' },
});