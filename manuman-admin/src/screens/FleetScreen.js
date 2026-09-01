import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
  Alert, ActivityIndicator, TextInput, Modal, Image, FlatList, Dimensions
} from 'react-native';
import { api } from '../api';
import { launchImageLibraryAsync } from 'expo-image-picker';

const { width } = Dimensions.get('window');
const EMPTY_CAR = { year: '', make: '', model: '', category: 'SEDAN', price: '', image_url: '', interior_images: '', features: '', available: true };

export default function FleetScreen() {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [form, setForm] = useState(EMPTY_CAR);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [exteriorPreview, setExteriorPreview] = useState(null);
  const [interiorPreviews, setInteriorPreviews] = useState([]);

  async function load() {
    try {
      const data = await api.get('/fleet');
      setFleet(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Could not load fleet', error.message);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  function openDetail(car) { setSelectedCar(car); setActiveImg(0); setDetailModal(true); }
  function openAdd() { setForm(EMPTY_CAR); setExteriorPreview(null); setInteriorPreviews([]); setEditing(null); setEditModal(true); }
  function openEdit(car) {
    setForm({
      ...car,
      features: (car.features || []).join(', '),
      interior_images: (car.interior_images || []).join(', '),
    });
    setExteriorPreview(car.image_url ? { uri: car.image_url } : null);
    setInteriorPreviews((car.interior_images || []).map(uri => ({ uri })));
    setEditing(car.id); setEditModal(true);
  }

  async function toggleAvailable(car) {
    await api.put(`/fleet/${car.id}`, { ...car, available: !car.available });
    load();
  }

  async function save() {
    if (!form.year || !form.make || !form.model || !form.price) {
      Alert.alert('Missing fields', 'Year, make, model and price are required.'); return;
    }
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      features: form.features ? form.features.split(',').map(f => f.trim()).filter(Boolean) : [],
      interior_images: form.interior_images ? form.interior_images.split(',').map(u => u.trim()).filter(Boolean) : [],
    };
    if (editing) await api.put(`/fleet/${editing}`, payload);
    else await api.post('/fleet', payload);
    setSaving(false); setEditModal(false); load();
  }

  async function deleteCar(id) {
    Alert.alert('Delete Car', 'Remove this car from the fleet?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.del(`/fleet/${id}`); load(); } }
    ]);
  }

  async function uploadImage(base64, contentType = 'image/jpeg') {
    const result = await api.post('/upload', { image: base64, contentType });
    if (result.url) return result.url;
    throw new Error(result.message || 'Upload failed');
  }

  async function pickImage(isInterior = false) {
    const result = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (result.canceled) return;
    const assets = result.assets;
    if (!assets || assets.length === 0) return;

    if (isInterior) {
      const newPreviews = [...interiorPreviews];
      const newUrls = form.interior_images ? form.interior_images.split(',').map(u => u.trim()).filter(Boolean) : [];
      for (const asset of assets) {
        if (asset.base64) {
          newPreviews.push({ uri: asset.uri, base64: asset.base64 });
          try {
            const url = await uploadImage(asset.base64, asset.mimeType || 'image/jpeg');
            newUrls.push(url);
          } catch (e) {
            Alert.alert('Upload failed', e.message);
          }
        }
      }
      setInteriorPreviews(newPreviews);
      setForm(f => ({ ...f, interior_images: newUrls.join(', ') }));
    } else {
      const asset = assets[0];
      setExteriorPreview({ uri: asset.uri, base64: asset.base64 });
      try {
        const url = await uploadImage(asset.base64, asset.mimeType || 'image/jpeg');
        setForm(f => ({ ...f, image_url: url }));
      } catch (e) {
        Alert.alert('Upload failed', e.message);
      }
    }
  }

  function removeExterior() {
    setExteriorPreview(null);
    setForm(f => ({ ...f, image_url: '' }));
  }

  function removeInterior(index) {
    const newPreviews = interiorPreviews.filter((_, i) => i !== index);
    const newUrls = form.interior_images.split(',').map(u => u.trim()).filter(Boolean).filter((_, i) => i !== index);
    setInteriorPreviews(newPreviews);
    setForm(f => ({ ...f, interior_images: newUrls.join(', ') }));
  }

  // All images for detail view: exterior + interior
  function getAllImages(car) {
    const imgs = [];
    if (car.image_url) imgs.push({ uri: car.image_url, label: 'Exterior' });
    (car.interior_images || []).forEach((u, i) => imgs.push({ uri: u, label: `Interior ${i + 1}` }));
    return imgs;
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#F5A800" /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Fleet</Text>
          <Text style={s.headerSub}>{fleet.length} vehicles</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Text style={s.addBtnText}>+ Add Car</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5A800" />}>
        {fleet.map(car => (
          <TouchableOpacity key={car.id} style={s.card} onPress={() => openDetail(car)} activeOpacity={0.9}>
            {car.image_url
              ? <Image source={{ uri: car.image_url }} style={s.carImg} />
              : <View style={[s.carImg, s.carImgPlaceholder]}><Text style={{ fontSize: 32 }}>🚗</Text></View>
            }
            {(car.interior_images?.length > 0) && (
              <View style={s.imgCountBadge}>
                <Text style={s.imgCountText}>📷 {1 + car.interior_images.length} photos</Text>
              </View>
            )}
            <View style={s.cardBody}>
              <View style={s.cardTop}>
                <View style={s.badge}><Text style={s.badgeText}>{car.category}</Text></View>
                <TouchableOpacity
                  style={[s.availToggle, { backgroundColor: car.available ? '#d1fae5' : '#fee2e2' }]}
                  onPress={() => toggleAvailable(car)}
                >
                  <Text style={[s.availToggleText, { color: car.available ? '#065f46' : '#991b1b' }]}>
                    {car.available ? '● Available' : '● Unavailable'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={s.carName}>{car.year} {car.make} {car.model}</Text>
              <Text style={s.carPrice}>${car.price}/day</Text>
              {car.features?.length > 0 && (
                <Text style={s.features}>{car.features.slice(0, 3).join(' · ')}</Text>
              )}
              <View style={s.actions}>
                <TouchableOpacity style={s.editBtn} onPress={() => openEdit(car)}>
                  <Text style={s.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.deleteBtn} onPress={() => deleteCar(car.id)}>
                  <Text style={s.deleteBtnText}>🗑 Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── DETAIL MODAL ── */}
      <Modal visible={detailModal} animationType="slide" presentationStyle="pageSheet">
        {selectedCar && (() => {
          const imgs = getAllImages(selectedCar);
          return (
            <View style={s.modal}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>{selectedCar.year} {selectedCar.make} {selectedCar.model}</Text>
                <TouchableOpacity onPress={() => setDetailModal(false)}><Text style={s.modalClose}>✕</Text></TouchableOpacity>
              </View>
              <ScrollView>
                {/* Image gallery */}
                {imgs.length > 0 ? (
                  <View>
                    <FlatList
                      data={imgs}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(_, i) => String(i)}
                      onMomentumScrollEnd={e => setActiveImg(Math.round(e.nativeEvent.contentOffset.x / width))}
                      renderItem={({ item }) => (
                        <View style={{ width }}>
                          <Image source={{ uri: item.uri }} style={s.galleryImg} />
                          <View style={s.imgLabel}><Text style={s.imgLabelText}>{item.label}</Text></View>
                        </View>
                      )}
                    />
                    <View style={s.dots}>
                      {imgs.map((_, i) => (
                        <View key={i} style={[s.dot, i === activeImg && s.dotActive]} />
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={s.noImg}><Text style={{ fontSize: 48 }}>🚗</Text></View>
                )}

                <View style={s.detailBody}>
                  <View style={s.detailRow}>
                    <View style={s.badge}><Text style={s.badgeText}>{selectedCar.category}</Text></View>
                    <View style={[s.availToggle, { backgroundColor: selectedCar.available ? '#d1fae5' : '#fee2e2' }]}>
                      <Text style={[s.availToggleText, { color: selectedCar.available ? '#065f46' : '#991b1b' }]}>
                        {selectedCar.available ? '● Available' : '● Unavailable'}
                      </Text>
                    </View>
                  </View>

                  <Text style={s.detailPrice}>${selectedCar.price}<Text style={s.detailPriceSub}>/day</Text></Text>

                  {selectedCar.features?.length > 0 && (
                    <View style={s.featuresSection}>
                      <Text style={s.sectionLabel}>Features</Text>
                      {selectedCar.features.map((f, i) => (
                        <View key={i} style={s.featureRow}>
                          <Text style={s.featureDot}>✓</Text>
                          <Text style={s.featureText}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={s.detailActions}>
                    <TouchableOpacity style={s.editBtnFull} onPress={() => { setDetailModal(false); openEdit(selectedCar); }}>
                      <Text style={s.editBtnText}>✏️ Edit Car</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.availBtnFull, { backgroundColor: selectedCar.available ? '#fee2e2' : '#d1fae5' }]}
                      onPress={() => { toggleAvailable(selectedCar); setDetailModal(false); }}
                    >
                      <Text style={[s.availBtnText, { color: selectedCar.available ? '#991b1b' : '#065f46' }]}>
                        {selectedCar.available ? '🔴 Mark Unavailable' : '🟢 Mark Available'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          );
        })()}
      </Modal>

      {/* ── EDIT / ADD MODAL ── */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editing ? 'Edit Car' : 'Add Car'}</Text>
            <TouchableOpacity onPress={() => setEditModal(false)}><Text style={s.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={s.modalBody}>
            {[
              ['Year', 'year', 'numeric'],
              ['Make', 'make', 'default'],
              ['Model', 'model', 'default'],
              ['Price/day ($)', 'price', 'numeric'],
              ['Features (comma separated)', 'features', 'default'],
            ].map(([label, key, kb]) => (
              <View key={key} style={s.field}>
                <Text style={s.fieldLabel}>{label}</Text>
                <TextInput
                  style={s.fieldInput}
                  value={String(form[key] || '')}
                  onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                  keyboardType={kb}
                  placeholder={label}
                  placeholderTextColor="#bbb"
                  multiline={key === 'features'}
                />
              </View>
            ))}

            <View style={s.field}>
              <Text style={s.fieldLabel}>Exterior Image</Text>
              {exteriorPreview && (
                <View style={s.previewRow}>
                  <Image source={{ uri: exteriorPreview.uri }} style={s.previewImg} />
                  <TouchableOpacity style={s.removeBtn} onPress={removeExterior}>
                    <Text style={s.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={s.pickerRow}>
                <TouchableOpacity style={s.pickerBtn} onPress={() => pickImage(false)}>
                  <Text style={s.pickerBtnText}>📷 Choose from Device</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[s.fieldInput, { marginTop: 8 }]}
                value={String(form.image_url || '')}
                onChangeText={v => setForm(f => ({ ...f, image_url: v }))}
                placeholder="Or paste image URL"
                placeholderTextColor="#bbb"
              />
            </View>

            <View style={s.field}>
              <Text style={s.fieldLabel}>Interior Images</Text>
              <View style={s.previewGrid}>
                {interiorPreviews.map((prev, i) => (
                  <View key={i} style={s.previewWrap}>
                    <Image source={{ uri: prev.uri }} style={s.previewImg} />
                    <TouchableOpacity style={s.removeBtn} onPress={() => removeInterior(i)}>
                      <Text style={s.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={[s.pickerBtn, { marginTop: 8 }]} onPress={() => pickImage(true)}>
                <Text style={s.pickerBtnText}>➕ Add Interior Photo</Text>
              </TouchableOpacity>
              <TextInput
                style={[s.fieldInput, { marginTop: 8 }]}
                value={String(form.interior_images || '')}
                onChangeText={v => setForm(f => ({ ...f, interior_images: v }))}
                placeholder="Or paste URLs (comma separated)"
                placeholderTextColor="#bbb"
                multiline
              />
            </View>

            <View style={s.field}>
              <Text style={s.fieldLabel}>Category</Text>
              <View style={s.categoryRow}>
                {['SEDAN','SUV','MINIVAN','TRUCK','LUXURY'].map(c => (
                  <TouchableOpacity key={c} style={[s.catBtn, form.category === c && s.catBtnActive]} onPress={() => setForm(f => ({ ...f, category: c }))}>
                    <Text style={[s.catText, form.category === c && s.catTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.fieldLabel}>Availability</Text>
              <View style={s.categoryRow}>
                {[true, false].map(v => (
                  <TouchableOpacity key={String(v)} style={[s.catBtn, form.available === v && s.catBtnActive]} onPress={() => setForm(f => ({ ...f, available: v }))}>
                    <Text style={[s.catText, form.available === v && s.catTextActive]}>{v ? '✅ Available' : '🔴 Unavailable'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#0d1b2a" /> : <Text style={s.saveBtnText}>{editing ? 'Save Changes' : 'Add to Fleet'}</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f9' },
  header: { backgroundColor: '#0d1b2a', padding: 24, paddingTop: 16, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
  addBtn: { backgroundColor: '#F5A800', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { fontWeight: '800', color: '#0d1b2a', fontSize: 14 },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  carImg: { width: '100%', height: 160, resizeMode: 'cover' },
  carImgPlaceholder: { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  imgCountBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  imgCountText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { backgroundColor: '#0d1b2a', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { color: '#F5A800', fontSize: 11, fontWeight: '800' },
  availToggle: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  availToggleText: { fontSize: 12, fontWeight: '700' },
  carName: { fontSize: 17, fontWeight: '800', color: '#0d1b2a', marginBottom: 4 },
  carPrice: { fontSize: 14, color: '#F5A800', fontWeight: '700', marginBottom: 6 },
  features: { fontSize: 12, color: '#888', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  editBtn: { flex: 1, backgroundColor: '#fff8e6', borderRadius: 8, padding: 10, alignItems: 'center' },
  editBtnText: { fontWeight: '700', color: '#0d1b2a', fontSize: 13 },
  deleteBtn: { flex: 1, backgroundColor: '#fee2e2', borderRadius: 8, padding: 10, alignItems: 'center' },
  deleteBtnText: { fontWeight: '700', color: '#991b1b', fontSize: 13 },
  // Detail modal
  modal: { flex: 1, backgroundColor: '#f4f6f9' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#0d1b2a' },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '800', flex: 1, marginRight: 12 },
  modalClose: { color: '#F5A800', fontSize: 20, fontWeight: '700' },
  galleryImg: { width, height: 260, resizeMode: 'cover' },
  imgLabel: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  imgLabelText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ddd' },
  dotActive: { backgroundColor: '#F5A800', width: 18 },
  noImg: { height: 200, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  detailBody: { padding: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  detailPrice: { fontSize: 32, fontWeight: '800', color: '#0d1b2a', marginBottom: 20 },
  detailPriceSub: { fontSize: 16, color: '#888', fontWeight: '400' },
  featuresSection: { marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  featureDot: { color: '#F5A800', fontWeight: '800', fontSize: 14 },
  featureText: { color: '#333', fontSize: 14 },
  detailActions: { gap: 10 },
  editBtnFull: { backgroundColor: '#fff8e6', borderRadius: 12, padding: 14, alignItems: 'center' },
  availBtnFull: { borderRadius: 12, padding: 14, alignItems: 'center' },
  availBtnText: { fontWeight: '800', fontSize: 14 },
  // Edit modal
  modalBody: { padding: 20 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 13, fontSize: 15, color: '#0d1b2a' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f0f0f0' },
  catBtnActive: { backgroundColor: '#F5A800' },
  catText: { fontSize: 12, fontWeight: '700', color: '#888' },
  catTextActive: { color: '#0d1b2a' },
  saveBtn: { backgroundColor: '#F5A800', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontWeight: '800', fontSize: 16, color: '#0d1b2a' },
  previewRow: { position: 'relative', marginBottom: 8 },
  previewWrap: { position: 'relative', marginRight: 8, marginBottom: 8 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  previewImg: { width: 100, height: 100, borderRadius: 10, resizeMode: 'cover' },
  pickerRow: { flexDirection: 'row', gap: 8 },
  pickerBtn: { flex: 1, backgroundColor: '#fff8e6', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#F5A800' },
  pickerBtnText: { fontWeight: '700', color: '#0d1b2a', fontSize: 13 },
  removeBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', borderRadius: 10, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
