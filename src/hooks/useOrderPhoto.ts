import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { OrderService } from '../services/order.service';

export function useOrderPhoto(storeId: string, storeName: string, storeAddr: string, totalAmount: string, cart: string, distance: number) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef<any>(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
      setCapturedPhoto(photo);
    }
  };

  const handleFinishOrder = async () => {
    if (!capturedPhoto) return;
    
    try {
      setIsUploading(true);
      
      await OrderService.submitOrder(
        storeId, 
        Number(totalAmount), 
        cart, 
        capturedPhoto.base64,
        distance
      );

      Alert.alert('Đơn hàng đã lưu', 'Chốt đơn thành công!', [
        { text: 'Xong', onPress: () => router.replace({
          pathname: '/(sale)/features/store-detail',
          params: { id: storeId, name: storeName, addr: storeAddr, dist: distance }
        } as any) },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi hệ thống', error.message);
    } finally { 
      setIsUploading(false); 
    }
  };

  return {
    permission,
    requestPermission,
    capturedPhoto,
    setCapturedPhoto,
    isUploading,
    cameraRef,
    takePicture,
    handleFinishOrder
  };
}
