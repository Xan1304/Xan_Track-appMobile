import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrderPhoto } from '../../../src/hooks/useOrderPhoto';

const { width, height } = Dimensions.get('window');
const NAVY = '#1a3a6b';

export default function OrderPhotoPage() {
  const { id, name, addr, totalAmount, cart, khoang_cach } = useLocalSearchParams();
  const router = useRouter();

  const {
    permission,
    requestPermission,
    capturedPhoto,
    setCapturedPhoto,
    isUploading,
    cameraRef,
    takePicture,
    handleFinishOrder
  } = useOrderPhoto(id as string, name as string, addr as string, totalAmount as string, cart as string, Number(khoang_cach) || 0);

  if (!permission?.granted) {
    return (
      <View style={styles.permScreen}>
        <View style={styles.permIconBox}>
          <Ionicons name="camera-outline" size={28} color={NAVY} />
        </View>
        <Text style={styles.permTitle}>Cần quyền Camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
          <Text style={styles.permBtnText}>Cấp quyền</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Xác nhận biên bản</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {!capturedPhoto ? (
        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />
          <View style={styles.overlay}>
            <View style={styles.guideLabelBox}>
              <Text style={styles.guideLabel}>Chụp biên bản có chữ ký chủ shop</Text>
            </View>
            <View style={styles.docFrame} />
            <TouchableOpacity style={styles.shutterBtn} onPress={takePicture}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Image source={{ uri: capturedPhoto.uri }} style={{ flex: 1, resizeMode: 'contain' }} />
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeBtn} onPress={() => setCapturedPhoto(null)}>
              <Text style={styles.retakeBtnText}>Chụp lại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendBtn} onPress={handleFinishOrder} disabled={isUploading}>
              {isUploading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.sendBtnText}>Gửi đơn hàng</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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

  cameraWrap:     { flex: 1, overflow: 'hidden' },
  overlay:        { ...StyleSheet.absoluteFillObject, justifyContent: 'space-around', alignItems: 'center', paddingVertical: 40 },
  guideLabelBox:  { backgroundColor: 'rgba(26,58,107,0.8)', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20 },
  guideLabel:     { color: '#fff', fontSize: 13, fontWeight: '500' },
  docFrame:       { width: width * 0.82, height: height * 0.48, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', borderStyle: 'dashed', borderRadius: 14 },
  shutterBtn:     { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  shutterInner:   { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },

  previewActions: { flexDirection: 'row', padding: 20, gap: 14, backgroundColor: '#000' },
  retakeBtn:      { flex: 1, height: 52, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  retakeBtnText:  { color: '#fff', fontSize: 14, fontWeight: '500' },
  sendBtn:        { flex: 1.5, height: 52, backgroundColor: NAVY, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  sendBtnText:    { color: '#fff', fontSize: 14, fontWeight: '600' },
});
