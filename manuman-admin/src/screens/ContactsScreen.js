import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Linking } from 'react-native';
import { api } from '../api';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await api.get('/contacts');
      setContacts(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Could not load messages', error.message);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  async function deleteContact(id) {
    Alert.alert('Delete Message', 'Remove this message?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.del(`/contacts/${id}`); load(); } }
    ]);
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#F5A800" /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Messages</Text>
        <Text style={s.headerSub}>{contacts.length} total</Text>
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5A800" />}>
        {contacts.length === 0 && <Text style={s.empty}>No messages yet.</Text>}
        {contacts.map(c => (
          <View key={c.id} style={s.card}>
            <View style={s.cardTop}>
              <View style={s.avatar}><Text style={s.avatarText}>{(c.name || 'G')[0].toUpperCase()}</Text></View>
              <View style={s.info}>
                <Text style={s.name}>{c.name}</Text>
                <Text style={s.date}>{new Date(c.created_at).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteContact(c.id)} style={s.deleteBtn}>
                <Text style={s.deleteBtnText}>🗑</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.message}>{c.message}</Text>
            <View style={s.contactActions}>
              {c.email && (
                <TouchableOpacity style={s.contactBtn} onPress={() => Linking.openURL(`mailto:${c.email}`)}>
                  <Text style={s.contactBtnText}>✉️ {c.email}</Text>
                </TouchableOpacity>
              )}
              {c.phone && (
                <TouchableOpacity style={s.contactBtn} onPress={() => Linking.openURL(`tel:${c.phone}`)}>
                  <Text style={s.contactBtnText}>📞 {c.phone}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f9' },
  header: { backgroundColor: '#0d1b2a', padding: 24, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
  empty: { textAlign: 'center', color: '#aaa', padding: 40 },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F5A800', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#0d1b2a', fontWeight: '800', fontSize: 16 },
  info: { flex: 1 },
  name: { fontWeight: '800', color: '#0d1b2a', fontSize: 15 },
  date: { color: '#aaa', fontSize: 12, marginTop: 2 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 18 },
  message: { color: '#444', fontSize: 14, lineHeight: 21, marginBottom: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  contactActions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  contactBtn: { backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  contactBtnText: { fontSize: 12, fontWeight: '600', color: '#333' },
});
