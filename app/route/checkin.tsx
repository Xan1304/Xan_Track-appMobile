import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, Modal, Dimensions, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { decode } from 'base64-arraybuffer';

const { width, height } = Dimensions.get('window');
const NAVY = '#1a3a6b';

export default function CheckinPage() {
  const { id, name, dist, addr } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const cameraRef = useRef<any>(null);
  const router = useRouter();
  const isInRange = Number(dist) <= 50;

  if (!permission?.granted) {
    return (
      <View style={styles.permissionScreen}>
        <View style={styles.permIconBox}>
          <MaterialCommunityIcons name="camera-off" size={32} color={NAVY} />
        </View>
        <Text style={styles.permTitle}>Cần quyền Camera</Text>
        <Text style={styles.permSub}>Ứng dụng cần truy cập camera để chụp ảnh minh chứng check-in</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
          <Text style={styles.permBtnText}>Cấp quyền Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
      setCapturedPhoto(photo);
      setPreviewVisible(true);
    }
  };

  const handleFinalCheckin = async () => {
    if (!capturedPhoto) {
      Alert.alert('Thiếu ảnh', 'Vui lòng chụp ảnh minh chứng!');
      return;
    }
    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email?.toLowerCase();
      const fileName = `${user?.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('checkin')
        .upload(fileName, decode(capturedPhoto.base64), { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('checkin').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('lich_su_checkin').insert({
        nhan_vien_email: userEmail,
        cua_hang_id: id,
        image_url: publicUrl,
        khoang_cach: Math.round(Number(dist)),
        loai_hinh: 'checkin',
      });

      if (dbError) throw dbError;

      Alert.alert('Thành công', 'Check-in thành công!');
      router.push({ pathname: '/route/store-detail', params: { id, name, addr } } as any);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác thực check-in</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Store info card */}
        <View style={styles.storeCard}>
          <View style={styles.storeCardLeft}>
            <Text style={styles.storeName}>{name}</Text>
            <Text style={styles.storeAddr} numberOfLines={2}>{addr}</Text>
          </View>
          <View style={[styles.gpsBadge, { backgroundColor: isInRange ? '#f0fdf4' : '#fef2f2' }]}>
            <View style={[styles.gpsIndicator, { backgroundColor: isInRange ? '#16a34a' : '#dc2626' }]} />
            <Text style={[styles.gpsBadgeText, { color: isInRange ? '#16a34a' : '#dc2626' }]}>
              {isInRange ? 'Hợp lệ' : `${Math.round(Number(dist))}m`}
            </Text>
          </View>
        </View>

        {/* Dist info */}
        {!isInRange && (
          <View style={styles.warningBar}>
            <Ionicons name="warning-outline" size={14} color="#b45309" />
            <Text style={styles.warningText}>
              Bạn cách cửa hàng {Math.round(Number(dist))}m — cần ở trong vòng 50m để check-in
            </Text>
          </View>
        )}

        {/* Photo area */}
        <TouchableOpacity
          style={styles.photoBox}
          onPress={() => setShowCamera(true)}
          activeOpacity={0.8}
        >
          {capturedPhoto ? (
            <>
              <Image source={{ uri: capturedPhoto.uri }} style={styles.capturedImg} />
              <View style={styles.retakeOverlay}>
                <Ionicons name="camera-reverse-outline" size={20} color="#fff" />
                <Text style={styles.retakeOverlayText}>Chụp lại</Text>
              </View>
            </>
          ) : (
            <View style={styles.photoPlaceholderContent}>
              <View style={styles.cameraIconBox}>
                <MaterialCommunityIcons name="camera-plus" size={28} color={NAVY} />
              </View>
              <Text style={styles.photoPlaceholderTitle}>Chụp ảnh minh chứng</Text>
              <Text style={styles.photoPlaceholderSub}>Selfie với biển hiệu cửa hàng</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (!capturedPhoto || !isInRange || isUploading) && styles.confirmBtnDisabled,
          ]}
          onPress={handleFinalCheckin}
          disabled={!capturedPhoto || !isInRange || isUploading}
          activeOpacity={0.85}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.confirmBtnText}>Xác nhận vào cửa hàng</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <View style={styles.cameraModal}>
          {!previewVisible ? (
            <View style={{ flex: 1 }}>
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="front" />
              <SafeAreaView style={styles.cameraUI}>
                <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={26} color="#fff" />
                </TouchableOpacity>
                <View style={styles.ovalGuide}>
                  <View style={styles.faceOval} />
                  <Text style={styles.guideLabel}>Đặt gương mặt vào khung</Text>
                </View>
                <TouchableOpacity onPress={takePicture} style={styles.shutterBtn}>
                  <View style={styles.shutterInner} />
                </TouchableOpacity>
              </SafeAreaView>
            </View>
          ) : (
            <View style={styles.previewContainer}>
              <Image source={{ uri: capturedPhoto?.uri }} style={styles.fullPreview} />
              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={styles.previewRetake}
                  onPress={() => setPreviewVisible(false)}
                >
                  <Text style={styles.previewRetakeText}>Chụp lại</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.previewSave}
                  onPress={() => { setPreviewVisible(false); setShowCamera(false); }}
                >
                  <Text style={styles.previewSaveText}>Dùng ảnh này</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f5f6f8' },

  // Permission screen
  permissionScreen:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#f5f6f8' },
  permIconBox:        { width: 64, height: 64, borderRadius: 18, backgroundColor: '#e8eef8', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  permTitle:          { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  permSub:            { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  permBtn:            { backgroundColor: NAVY, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 13 },
  permBtnText:        { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Header
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' },
  backBtn:            { width: 40, height: 40, justifyContent: 'center' },
  headerTitle:        { fontSize: 16, fontWeight: '600', color: '#0f172a' },

  content:            { flex: 1, padding: 18 },

  // Store card
  storeCard:          { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 16, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  storeCardLeft:      { flex: 1, marginRight: 12 },
  storeName:          { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  storeAddr:          { fontSize: 12, color: '#64748b', lineHeight: 18 },
  gpsBadge:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, flexShrink: 0 },
  gpsIndicator:       { width: 6, height: 6, borderRadius: 3 },
  gpsBadgeText:       { fontSize: 11, fontWeight: '600' },

  // Warning
  warningBar:         { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 0.5, borderColor: '#fde68a' },
  warningText:        { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 18 },

  // Photo
  photoBox:           { flex: 1, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  photoPlaceholderContent: { alignItems: 'center', gap: 10 },
  cameraIconBox:      { width: 56, height: 56, borderRadius: 16, backgroundColor: '#e8eef8', justifyContent: 'center', alignItems: 'center' },
  photoPlaceholderTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  photoPlaceholderSub: { fontSize: 12, color: '#94a3b8' },
  capturedImg:        { width: '100%', height: '100%', resizeMode: 'cover' },
  retakeOverlay:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  retakeOverlayText:  { color: '#fff', fontSize: 13, fontWeight: '500' },

  // Footer
  footer:             { padding: 18, paddingBottom: Platform.OS === 'ios' ? 32 : 18, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)' },
  confirmBtn:         { backgroundColor: NAVY, height: 52, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  confirmBtnDisabled: { backgroundColor: '#cbd5e1' },
  confirmBtnText:     { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Camera
  cameraModal:        { flex: 1, backgroundColor: '#000' },
  cameraUI:           { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 48 },
  closeBtn:           { alignSelf: 'flex-start', marginLeft: 24, width: 40, height: 40, justifyContent: 'center' },
  ovalGuide:          { alignItems: 'center' },
  faceOval:           { width: width * 0.65, height: height * 0.38, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 200, borderStyle: 'dashed' },
  guideLabel:         { color: 'rgba(255,255,255,0.85)', marginTop: 18, fontSize: 14 },
  shutterBtn:         { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  shutterInner:       { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },

  // Preview
  previewContainer:   { flex: 1, backgroundColor: '#000' },
  fullPreview:        { flex: 1, resizeMode: 'contain' },
  previewActions:     { flexDirection: 'row', padding: 24, gap: 14, backgroundColor: '#000' },
  previewRetake:      { flex: 1, height: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  previewRetakeText:  { color: '#fff', fontSize: 14, fontWeight: '500' },
  previewSave:        { flex: 1, height: 50, backgroundColor: NAVY, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  previewSaveText:    { color: '#fff', fontSize: 14, fontWeight: '600' },
});