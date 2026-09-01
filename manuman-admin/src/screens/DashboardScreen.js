import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { api } from '../api';

function StatCard({ label, value, icon, color }) {
  return (
    <View style={[s.statCard, { borderLeftColor: color }]}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const [bookings, setBookings] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const [b, f, c] = await Promise.all([api.get('/bookings'), api.get('/fleet'), api.get('/contacts')]);
      setBookings(Array.isArray(b) ? b : []);
      setFleet(Array.isArray(f) ? f : []);
      setContacts(Array.isArray(c) ? c : []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  const revenue = bookings.filter(b => b.status === 'paid').reduce((s, b) => s + (b.total_amount || 0), 0);
  const pending = bookings.filter(b => b.status === 'pending').length;
  const paid = bookings.filter(b => b.status === 'paid').length;
  const recent = [...bookings].slice(0, 5);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#F5A800" /></View>;

  if (error) return (
    <View style={s.center}>
      <Text style={s.errorTitle}>Could not load dashboard</Text>
      <Text style={s.errorText}>{error}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={() => { setLoading(true); load(); }}>
        <Text style={s.retryText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5A800" />}>
      <View style={s.header}>
        <Text style={s.greeting}>Good day 👋</Text>
        <Text style={s.headerTitle}>Dashboard</Text>
      </View>

      <View style={s.statsGrid}>
        <StatCard label="Total Revenue" value={`$${revenue.toLocaleString()}`} icon="💰" color="#F5A800" />
        <StatCard label="Total Bookings" value={bookings.length} icon="📅" color="#3498db" />
        <StatCard label="Paid" value={paid} icon="✅" color="#2ecc71" />
        <StatCard label="Pending" value={pending} icon="⏳" color="#e67e22" />
        <StatCard label="Fleet Size" value={fleet.length} icon="🚗" color="#9b59b6" />
        <StatCard label="Messages" value={contacts.length} icon="✉️" color="#e74c3c" />
      </View>

      <Text style={s.sectionTitle}>Recent Bookings</Text>
      {recent.length === 0 && <Text style={s.empty}>No bookings yet.</Text>}
      {recent.map(b => (
        <View key={b.id} style={s.bookingRow}>
          <View style={s.bookingInfo}>
            <Text style={s.bookingName}>{b.customer_name || 'Guest'}</Text>
            <Text style={s.bookingCar}>{b.vehicle_name}</Text>
            <Text style={s.bookingDate}>{b.pickup_date} → {b.return_date}</Text>
          </View>
          <View style={s.bookingRight}>
            <Text style={s.bookingAmount}>${b.total_amount}</Text>
            <View style={[s.badge, b.status === 'paid' ? s.badgePaid : b.status === 'pending' ? s.badgePending : s.badgeCancelled]}>
              <Text style={s.badgeText}>{b.status}</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f9' },
  errorTitle: { color: '#0d1b2a', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  errorText: { color: '#666', fontSize: 14, textAlign: 'center', paddingHorizontal: 32, lineHeight: 21 },
  retryBtn: { backgroundColor: '#F5A800', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 18 },
  retryText: { color: '#0d1b2a', fontSize: 14, fontWeight: '800' },
  header: { backgroundColor: '#0d1b2a', padding: 24, paddingTop: 16, paddingBottom: 28 },
  greeting: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '47%', borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statIcon: { fontSize: 22, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0d1b2a', marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  empty: { textAlign: 'center', color: '#aaa', padding: 20 },
  bookingRow: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  bookingInfo: { flex: 1 },
  bookingName: { fontWeight: '700', color: '#0d1b2a', fontSize: 14, marginBottom: 2 },
  bookingCar: { color: '#555', fontSize: 13, marginBottom: 2 },
  bookingDate: { color: '#aaa', fontSize: 11 },
  bookingRight: { alignItems: 'flex-end', gap: 6 },
  bookingAmount: { fontWeight: '800', color: '#0d1b2a', fontSize: 15 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgePaid: { backgroundColor: '#d1fae5' },
  badgePending: { backgroundColor: '#fff3cd' },
  badgeCancelled: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize', color: '#333' },
});
