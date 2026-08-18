import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '../api';

export default function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!password) { setError('Enter your admin password.'); return; }
    setLoading(true); setError('');
    const data = await api.post('/admin/login', { password });
    setLoading(false);
    if (data.success) onLogin();
    else setError('Wrong password. Try again.');
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.card}>
        <View style={s.logoWrap}>
          <View style={s.logoBg}><Text style={s.logoIcon}>🚗</Text></View>
        </View>
        <Text style={s.title}>ManuMan Admin</Text>
        <Text style={s.sub}>Sign in to manage your rental business</Text>

        <Text style={s.label}>Admin Password</Text>
        <TextInput
          style={s.input}
          placeholder="Enter password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
        />
        {!!error && <Text style={s.error}>{error}</Text>}

        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#0d1b2a" /> : <Text style={s.btnText}>Sign In</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center' },
  logoWrap: { marginBottom: 16 },
  logoBg: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F5A800', alignItems: 'center', justifyContent: 'center' },
  logoIcon: { fontSize: 32 },
  title: { fontSize: 22, fontWeight: '800', color: '#0d1b2a', marginBottom: 6 },
  sub: { fontSize: 13, color: '#888', marginBottom: 28, textAlign: 'center' },
  label: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { width: '100%', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, fontSize: 15, color: '#0d1b2a', backgroundColor: '#fafafa', marginBottom: 8 },
  error: { color: '#e74c3c', fontSize: 13, marginBottom: 10, alignSelf: 'flex-start' },
  btn: { width: '100%', backgroundColor: '#F5A800', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { fontWeight: '800', fontSize: 16, color: '#0d1b2a' },
});
