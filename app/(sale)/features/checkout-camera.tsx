import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../src/services/supabase';
import { decode } from 'base64-arraybuffer';

const { width } = Dimensions.get('window');
const NAVY = '#1a3a6b';

export default function CheckoutCameraPage() {
  const { id, name, dist } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef<any>(null);
  const router = useRouter();

  if (!permission?.granted) {
    return (
      <View style={styles.permScreen}>
        <View style={styles.permIconBox}>
          <Ionicons name="camera-outline" size={30} color={NAVY} />
        </View>
        <Text style={styles.permTitle}>Cần quyền Camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
          <Text style={styles.permBtnText}>Cấp quyền Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleFinalCheckout = async () => {
    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `checkout/${id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('checkin')
        .upload(fileName, decode(capturedPhoto.base64), { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('checkin').getPublicUrl(fileName);

      await supabase.from('lich_su_checkin').insert({
        nhan_vien_email: user?.email,
        cua_hang_id: id,
        image_url: publicUrl,
        khoang_cach: dist ? Math.round(Number(dist)) : 0,
        loai_hinh: 'checkout',
      });

      Alert.alert('Checkout thành công', `Đã hoàn thành tại ${name}.`, [
        { text: 'Xong', onPress: () => router.replace('/(sale)') },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Xác thực checkout</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {!capturedPhoto ? (
        <View style={{ flex: 1 }}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="front" />
          {/* Overlay */}
          <View style={styles.overlay}>
            <View style={styles.ovalGuide}>
              <View style={styles.faceOval} />
              <View style={styles.guideLabelBox}>
                <Text style={styles.guideLabel}>Selfie + biển hiệu cửa hàng</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.shutterBtn}
              onPress={async () => {
                const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
                setCapturedPhoto(photo);
              }}
            >
              <View style={styles.shutterInner} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Image source={{ uri: capturedPhoto.uri }} style={styles.previewImg} />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => setCapturedPhoto(null)}
            >
              <Text style={styles.retakeBtnText}>Chụp lại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleFinalCheckout}>
              {isUploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.checkoutBtnText}>Hoàn tất checkout</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#000' },

  // Permission
  permScreen:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#f5f6f8' },
  permIconBox:    { width: 64, height: 64, borderRadius: 18, backgroundColor: '#e8eef8', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  permTitle:      { fontSize: 17, fontWeight: '600', color: '#0f172a', marginBottom: 20 },
  permBtn:        { backgroundColor: NAVY, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 },
  permBtnText:    { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Header
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' },
  closeBtn:       { width: 40, height: 40, justifyContent: 'center' },
  headerCenter:   { alignItems: 'center' },
  headerTitle:    { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  headerSub:      { fontSize: 11, color: '#64748b', marginTop: 2 },

  // Camera
  overlay:        { ...StyleSheet.absoluteFillObject, justifyContent: 'space-around', alignItems: 'center', paddingVertical: 40 },
  ovalGuide:      { alignItems: 'center' },
  faceOval:       { width: width * 0.68, height: width * 0.88, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', borderStyle: 'dashed', borderRadius: 200 },
  guideLabelBox:  { marginTop: 18, backgroundColor: 'rgba(26,58,107,0.75)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  guideLabel:     { color: '#fff', fontSize: 13, fontWeight: '500' },
  shutterBtn:     { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  shutterInner:   { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },

  // Preview
  previewImg:     { flex: 1, resizeMode: 'contain' },
  previewActions: { flexDirection: 'row', padding: 20, gap: 14, backgroundColor: '#000' },
  retakeBtn:      { flex: 1, height: 52, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  retakeBtnText:  { color: '#fff', fontSize: 14, fontWeight: '500' },
  checkoutBtn:    { flex: 1.6, height: 52, backgroundColor: '#dc2626', borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  checkoutBtnText:{ color: '#fff', fontSize: 14, fontWeight: '600' },
});

