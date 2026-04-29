import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { CheckinService } from '../services/checkin.service';

export function useCheckin(storeId: string, storeName: string, storeAddr: string, dist: string) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const cameraRef = useRef<any>(null);
  
  const distanceNumber = Number(dist);
  const isInRange = distanceNumber <= 50;

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
      
      await CheckinService.submitCheckin(storeId, distanceNumber, capturedPhoto.base64);

      Alert.alert('Thành công', 'Check-in thành công!');
      router.push({ pathname: '/(sale)/features/store-detail', params: { id: storeId, name: storeName, addr: storeAddr } } as any);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    permission,
    requestPermission,
    isUploading,
    showCamera,
    setShowCamera,
    capturedPhoto,
    setCapturedPhoto,
    previewVisible,
    setPreviewVisible,
    cameraRef,
    isInRange,
    distanceNumber,
    takePicture,
    handleFinalCheckin
  };
}
