// ═══════════════════════════════════════════════════════════════
// FILE: request-leave.tsx
// ═══════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import {
  View, Text, StyleSheet as RNStyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Image, ScrollView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../../src/services/supabase';

const NAVY = '#1a3a6b';

export function RequestLeave() {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [reason, setReason] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const uploadImage = async (uri: string) => {
    const fileName = `leave_${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append('file', { uri, name: fileName, type: 'image/jpeg' } as any);
    const { error } = await supabase.storage.from('leaves').upload(fileName, formData);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('leaves').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!reason.trim()) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập lý do nghỉ phép.');
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('ho_so_nhan_vien').select('ho_ten').eq('email', user?.email).single();
      let imageUrl = null;
      if (image) imageUrl = await uploadImage(image);

      const { error } = await supabase.from('don_nghi_phep').insert([{
        nhan_vien_email: user?.email,
        ho_ten_nhan_vien: profile?.ho_ten,
        ngay_bat_dau: startDate.toISOString().split('T')[0],
        ngay_ket_thuc: endDate.toISOString().split('T')[0],
        ly_do: reason,
        minh_chung_url: imageUrl,
        trang_thai: 'cho_duyet',
      }]);

      if (error) throw error;
      Alert.alert('Đã gửi đơn', 'Đơn nghỉ phép đang chờ phê duyệt.', [
        { text: 'Xong', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    } finally { setLoading(false); }
  };

  const formatDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  const dayCount = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1);

  const rlStyles = RNStyleSheet.create({
    container:      { flex: 1, backgroundColor: '#f5f6f8' },
    header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' },
    headerTitle:    { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    backBtn:        { width: 40, height: 40, justifyContent: 'center' },
    content:        { padding: 18, paddingBottom: 40 },
    sectionLabel:   { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.7, color: '#94a3b8', marginBottom: 10, marginTop: 20 },
    dateCard:       { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
    dateRow:        { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    dateLabel:      { fontSize: 12, color: '#64748b', flex: 1 },
    dateValue:      { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    dateDivider:    { height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: 14 },
    dayCountBadge:  { backgroundColor: '#e8eef8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginTop: 10 },
    dayCountText:   { fontSize: 12, fontWeight: '600', color: NAVY },
    reasonInput:    { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 14, fontSize: 14, color: '#0f172a', height: 100, textAlignVertical: 'top' },
    imgPicker:      { width: '100%', height: 140, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    imgPickerContent:{ alignItems: 'center', gap: 8 },
    imgPickerText:  { fontSize: 13, color: '#94a3b8' },
    previewImg:     { width: '100%', height: '100%', resizeMode: 'cover' },
    removeImgBtn:   { position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', borderRadius: 12 },
    submitBtn:      { backgroundColor: NAVY, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 28 },
    submitBtnText:  { color: '#fff', fontSize: 15, fontWeight: '600' },
  });

  return (
    <SafeAreaView style={rlStyles.container}>
      <View style={rlStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={rlStyles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={rlStyles.headerTitle}>Đơn xin nghỉ phép</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={rlStyles.content} showsVerticalScrollIndicator={false}>
        <Text style={rlStyles.sectionLabel}>Thời gian nghỉ</Text>

        <View style={rlStyles.dateCard}>
          <TouchableOpacity style={rlStyles.dateRow} onPress={() => setShowStart(true)}>
            <Ionicons name="calendar-outline" size={18} color={NAVY} />
            <Text style={rlStyles.dateLabel}>Từ ngày</Text>
            <Text style={rlStyles.dateValue}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
          <View style={rlStyles.dateDivider} />
          <TouchableOpacity style={rlStyles.dateRow} onPress={() => setShowEnd(true)}>
            <Ionicons name="calendar-outline" size={18} color={NAVY} />
            <Text style={rlStyles.dateLabel}>Đến ngày</Text>
            <Text style={rlStyles.dateValue}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={rlStyles.dayCountBadge}>
          <Text style={rlStyles.dayCountText}>Tổng {dayCount} ngày nghỉ</Text>
        </View>

        {showStart && (
          <DateTimePicker value={startDate} mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => { setShowStart(false); if (d) setStartDate(d); }} />
        )}
        {showEnd && (
          <DateTimePicker value={endDate} mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => { setShowEnd(false); if (d) setEndDate(d); }} />
        )}

        <Text style={rlStyles.sectionLabel}>Lý do nghỉ phép</Text>
        <TextInput
          style={rlStyles.reasonInput}
          multiline
          value={reason}
          onChangeText={setReason}
          placeholder="Mô tả lý do nghỉ phép..."
          placeholderTextColor="#cbd5e1"
        />

        <Text style={rlStyles.sectionLabel}>Ảnh minh chứng (tùy chọn)</Text>
        <TouchableOpacity style={rlStyles.imgPicker} onPress={pickImage}>
          {image ? (
            <>
              <Image source={{ uri: image }} style={rlStyles.previewImg} />
              <TouchableOpacity style={rlStyles.removeImgBtn} onPress={() => setImage(null)}>
                <Ionicons name="close-circle" size={24} color="#dc2626" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={rlStyles.imgPickerContent}>
              <Ionicons name="image-outline" size={28} color="#cbd5e1" />
              <Text style={rlStyles.imgPickerText}>Nhấn để chọn ảnh</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[rlStyles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={rlStyles.submitBtnText}>Gửi đơn</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default RequestLeave;

