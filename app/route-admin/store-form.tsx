import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

const NAVY = '#1a3a6b';

export default function StoreForm() {
  const { id } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (id) fetchStoreDetail();
  }, [id]);

  async function fetchStoreDetail() {
    try {
      const { data } = await supabase.from('danh_sach_cua_hang').select('*').eq('id', id).single();
      if (data) {
        setName(data.ten_cua_hang);
        setAddress(data.dia_chi);
        setLat(data.lat.toString());
        setLng(data.lng.toString());
      }
    } catch (e: any) {
      console.log(e.message);
    }
  }

  const handleSave = async () => {
    if (!name.trim() || !address.trim() || !lat || !lng) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ tất cả các trường.');
      return;
    }

    try {
      setLoading(true);
      const storeData = {
        ten_cua_hang: name.trim(),
        dia_chi: address.trim(),
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };

      let error;
      if (id) {
        const { error: err } = await supabase.from('danh_sach_cua_hang').update(storeData).eq('id', id);
        error = err;
      } else {
        const { error: err } = await supabase.from('danh_sach_cua_hang').insert([storeData]);
        error = err;
      }

      if (error) throw error;

      Alert.alert(
        'Thành công',
        id ? 'Cập nhật cửa hàng thành công!' : 'Thêm cửa hàng mới thành công!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setLoading(false);
    }
  };

  const isEditMode = !!id;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Cập nhật cửa hàng' : 'Thêm cửa hàng mới'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero section */}
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons
                name={isEditMode ? 'store-edit-outline' : 'store-plus-outline'}
                size={32}
                color={NAVY}
              />
            </View>
            <Text style={styles.heroTitle}>
              {isEditMode ? 'Chỉnh sửa thông tin' : 'Mở rộng mạng lưới'}
            </Text>
            <Text style={styles.heroSub}>
              {isEditMode
                ? 'Cập nhật thông tin đại lý XAN Milk'
                : 'Thêm đại lý mới vào hệ thống XAN Milk'
              }
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.sectionLabel}>Thông tin cơ bản</Text>

            <View style={styles.fieldGroup}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Tên cửa hàng / Đại lý</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="VD: Đại lý DXS Milk"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Địa chỉ</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  multiline
                  numberOfLines={3}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Số nhà, tên đường, phường, quận..."
                  placeholderTextColor="#94a3b8"
                  textAlignVertical="top"
                />
              </View>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Tọa độ GPS</Text>

            <View style={styles.fieldGroup}>
              <View style={styles.coordRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Vĩ độ (Latitude)</Text>
                  <View style={styles.coordInput}>
                    <Ionicons name="navigate-outline" size={14} color="#94a3b8" />
                    <TextInput
                      style={styles.coordInputText}
                      keyboardType="numeric"
                      value={lat}
                      onChangeText={setLat}
                      placeholder="10.xxxx"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Kinh độ (Longitude)</Text>
                  <View style={styles.coordInput}>
                    <Ionicons name="navigate-outline" size={14} color="#94a3b8" />
                    <TextInput
                      style={styles.coordInputText}
                      keyboardType="numeric"
                      value={lng}
                      onChangeText={setLng}
                      placeholder="106.xxxx"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.coordHint}>
                <Ionicons name="information-circle-outline" size={13} color="#94a3b8" />
                <Text style={styles.coordHintText}>
                  Dùng Google Maps để lấy tọa độ chính xác của cửa hàng.
                </Text>
              </View>
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name={isEditMode ? 'checkmark' : 'add'} size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>
                    {isEditMode ? 'Cập nhật ngay' : 'Lưu vào hệ thống'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerBack: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },

  scrollContent: { padding: 14, paddingBottom: 40 },

  heroSection: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 22, alignItems: 'center', marginBottom: 14,
  },
  heroIcon: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 0.5, borderColor: 'rgba(26,58,107,0.1)',
    marginBottom: 12,
  },
  heroTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  heroSub: { fontSize: 12, color: '#94a3b8', textAlign: 'center' },

  sectionLabel: {
    fontSize: 10, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.7, color: '#94a3b8', marginBottom: 8,
  },

  form: { gap: 4 },
  fieldGroup: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 14, gap: 14, marginBottom: 8,
  },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)', borderRadius: 10,
    paddingHorizontal: 14, height: 46, fontSize: 14, color: '#0f172a',
  },
  inputMulti: {
    height: 80, paddingTop: 12, paddingBottom: 12,
  },

  coordRow: { flexDirection: 'row', gap: 10 },
  coordInput: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f8fafc', borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)', borderRadius: 10,
    paddingHorizontal: 12, height: 46,
  },
  coordInputText: { flex: 1, fontSize: 14, color: '#0f172a' },
  coordHint: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 2 },
  coordHintText: { fontSize: 11, color: '#94a3b8', flex: 1, lineHeight: 16 },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 14, backgroundColor: NAVY, marginTop: 16,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15, letterSpacing: 0.3 },
});