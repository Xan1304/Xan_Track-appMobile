import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../../src/constants/Theme';
import { useDisplayPhoto } from '../../../src/hooks/useDisplayPhoto';

export default function DisplayPhotoPage() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const { permission, requestPermission, capturedPhoto, setCapturedPhoto, isUploading, cameraRef, handleSaveDisplay } = useDisplayPhoto(id as string);

  if (!permission?.granted) {
    return (
      <View style={styles.permScreen}>
        <Text style={styles.permTitle}>Cần quyền Camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permBtn}><Text style={styles.permBtnText}>Cấp quyền</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Trưng bày: {name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ flex: 1 }}>
        {!capturedPhoto ? (
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
            <View style={styles.shutterContainer}>
              <TouchableOpacity style={styles.shutterBtn} onPress={async () => {
                const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
                setCapturedPhoto(photo);
              }} />
            </View>
          </CameraView>
        ) : (
          <View style={{ flex: 1 }}>
            <Image source={{ uri: capturedPhoto.uri }} style={{ flex: 1 }} />
            <View style={styles.footer}>
              <TouchableOpacity style={styles.retakeBtn} onPress={() => setCapturedPhoto(null)}><Text style={{ color: '#fff' }}>Chụp lại</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDisplay}>
                {isUploading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Lưu ảnh</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  shutterContainer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 40 },
  shutterBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', borderWidth: 5, borderColor: 'rgba(255,255,255,0.3)' },
  footer: { flexDirection: 'row', padding: 20, gap: 10, backgroundColor: '#000' },
  saveBtn: { flex: 1, height: 50, backgroundColor: Theme.NAVY, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  retakeBtn: { flex: 1, height: 50, borderWidth: 1, borderColor: '#fff', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  permScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permTitle: { marginBottom: 20, fontSize: 16 },
  permBtn: { backgroundColor: Theme.NAVY, padding: 15, borderRadius: 10 },
  permBtnText: { color: '#fff' }
});