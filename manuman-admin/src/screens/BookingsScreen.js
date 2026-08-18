import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api';

const STATUS_COLORS = { paid: '#d1fae5', pending: '#fff3cd', cancelled: '#fee2e2' };
const STATUS_TEXT = { paid: '#065f46', pending: '#856404', cancelled: '#991b1b' };

export default function BookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  async function load() {
    const data = await api.get('/bookings');
    setBookings(Array.isArray(data) ? data : []);
    setLoading(false); setRefreshing(false);
  }

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  async function updateStatus(id, status) {
    await api.patch(`/bookings/${id}`, { status });
    load();
  }

  async function deleteBooking(id) {
    Alert.alert('Delete Booking', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.del(`/bookings/${id}`); load(); } }
    ]);
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#F5A800" /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Bookings</Text>
        <Text style={s.headerSub}>{bookings.length} total</Text>
      </View>

      <View style={s.filters}>
        {['all','paid','pending','cancelled'].map(f => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5A800" />}>
        {filtered.length === 0 && <Text style={s.empty}>No bookings found.</Text>}
        {filtered.map(b => (
          <View key={b.id} style={s.card}>
            <View style={s.cardTop}>
              <View style={s.cardInfo}>
                <Text style={s.name}>{b.customer_name || 'Guest'}</Text>
                <Text style={s.car}>{b.vehicle_name}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: STATUS_COLORS[b.status] || '#eee' }]}>
                <Text style={[s.badgeText, { color: STATUS_TEXT[b.status] || '#333' }]}>{b.status}</Text>
              </View>
            </View>

            <View style={s.details}>
              <Text style={s.detail}>📍 {b.pickup}</Text>
              <Text style={s.detail}>📅 {b.pickup_date} → {b.return_date}</Text>
              <Text style={s.detail}>📞 {b.customer_phone || '—'}</Text>
              <Text style={s.detail}>✉️ {b.customer_email || '—'}</Text>
              <Text style={s.detail}>💳 {b.payment_method} · <Text style={s.amount}>${b.total_amount}</Text></Text>
            </View>

            <View style={s.actions}>
              {b.status !== 'paid' && (
                <TouchableOpacity style={[s.actionBtn, s.btnPaid]} onPress={() => updateStatus(b.id, 'paid')}>
                  <Text style={s.actionText}>✅ Mark Paid</Text>
                </TouchableOpacity>
              )}
              {b.status !== 'cancelled' && (
                <TouchableOpacity style={[s.actionBtn, s.btnCancel]} onPress={() => updateStatus(b.id, 'cancelled')}>
                  <Text style={s.actionText}>❌ Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[s.actionBtn, s.btnDelete]} onPress={() => deleteBooking(b.id)}>
                <Text style={s.actionText}>🗑 Delete</Text>
              </TouchableOpacity>
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
  filters: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f0f0f0' },
  filterActive: { backgroundColor: '#F5A800' },
  filterText: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'capitalize' },
  filterTextActive: { color: '#0d1b2a' },
  empty: { textAlign: 'center', color: '#aaa', padding: 40 },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardInfo: { flex: 1 },
  name: { fontWeight: '800', fontSize: 15, color: '#0d1b2a' },
  car: { color: '#555', fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  details: { gap: 5, marginBottom: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  detail: { fontSize: 13, color: '#555' },
  amount: { fontWeight: '800', color: '#0d1b2a' },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnPaid: { backgroundColor: '#d1fae5' },
  btnCancel: { backgroundColor: '#fff3cd' },
  btnDelete: { backgroundColor: '#fee2e2' },
  actionText: { fontSize: 12, fontWeight: '700', color: '#333' },
});
