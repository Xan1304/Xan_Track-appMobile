// ═══════════════════════════════════════════════════════════════
// FILE: display-photo.tsx
// ═══════════════════════════════════════════════════════════════
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { decode } from 'base64-arraybuffer';

const NAVY = '#1a3a6b';

export function DisplayPhotoPage() {
  const { id, name } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef<any>(null);
  const router = useRouter();

  if (!permission?.granted) {
    return (
      <View style={dpStyles.permScreen}>
        <View style={dpStyles.permIconBox}>
          <Ionicons name="camera-outline" size={28} color={NAVY} />
        </View>
        <Text style={dpStyles.permTitle}>Cần quyền Camera</Text>
        <TouchableOpacity onPress={requestPermission} style={dpStyles.permBtn}>
          <Text style={dpStyles.permBtnText}>Cấp quyền</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSaveDisplay = async () => {
    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email?.toLowerCase();
      const fileName = `display/${id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('checkin').upload(fileName, decode(capturedPhoto.base64), { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('checkin').getPublicUrl(fileName);

      await supabase.from('lich_su_checkin').insert({
        nhan_vien_email: userEmail,
        cua_hang_id: id,
        image_url: publicUrl,
        loai_hinh: 'trung_bay',
      });

      Alert.alert('Đã lưu', 'Ảnh trưng bày kệ hàng đã được lưu.', [
        { text: 'Xong', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message);
    } finally { setIsUploading(false); }
  };

  return (
    <SafeAreaView style={dpStyles.container}>
      <View style={dpStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={dpStyles.closeBtn}>
          <Ionicons name="close" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={dpStyles.headerCenter}>
          <Text style={dpStyles.headerTitle}>Trưng bày kệ hàng</Text>
          <Text style={dpStyles.headerSub} numberOfLines={1}>{name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1 }}>
        {!capturedPhoto ? (
          <View style={{ flex: 1 }}>
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />
            <View style={dpStyles.overlay}>
              <View style={dpStyles.guideLabelBox}>
                <Text style={dpStyles.guideLabel}>Chụp toàn bộ kệ hàng XAN</Text>
              </View>
              <TouchableOpacity
                style={dpStyles.shutterBtn}
                onPress={async () => {
                  const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
                  setCapturedPhoto(photo);
                }}
              >
                <View style={dpStyles.shutterInner} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Image source={{ uri: capturedPhoto.uri }} style={{ flex: 1, resizeMode: 'contain' }} />
            <View style={dpStyles.previewActions}>
              <TouchableOpacity style={dpStyles.retakeBtn} onPress={() => setCapturedPhoto(null)}>
                <Text style={dpStyles.retakeBtnText}>Chụp lại</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dpStyles.saveBtn} onPress={handleSaveDisplay}>
                {isUploading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={dpStyles.saveBtnText}>Lưu ảnh</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const dpStyles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#000' },
  permScreen:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#f5f6f8' },
  permIconBox:    { width: 60, height: 60, borderRadius: 16, backgroundColor: '#e8eef8', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  permTitle:      { fontSize: 17, fontWeight: '600', color: '#0f172a', marginBottom: 20 },
  permBtn:        { backgroundColor: NAVY, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 },
  permBtnText:    { color: '#fff', fontSize: 14, fontWeight: '600' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' },
  closeBtn:       { width: 40, height: 40, justifyContent: 'center' },
  headerCenter:   { alignItems: 'center' },
  headerTitle:    { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  headerSub:      { fontSize: 11, color: '#64748b', marginTop: 2 },
  overlay:        { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 40 },
  guideLabelBox:  { backgroundColor: 'rgba(26,58,107,0.8)', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20 },
  guideLabel:     { color: '#fff', fontSize: 13, fontWeight: '500' },
  shutterBtn:     { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  shutterInner:   { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  previewActions: { flexDirection: 'row', padding: 20, gap: 14, backgroundColor: '#000' },
  retakeBtn:      { flex: 1, height: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  retakeBtnText:  { color: '#fff', fontSize: 14, fontWeight: '500' },
  saveBtn:        { flex: 1, height: 50, backgroundColor: NAVY, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  saveBtnText:    { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default DisplayPhotoPage;