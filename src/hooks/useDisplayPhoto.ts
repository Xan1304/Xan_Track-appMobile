import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import { DisplayService } from '../services/display.service';
import { supabase } from '../services/supabase';

export function useDisplayPhoto(storeId: string) {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [capturedPhoto, setCapturedPhoto] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const cameraRef = useRef<any>(null);

    // Hàm tính khoảng cách giữa 2 tọa độ (mét)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // Bán kính Trái Đất
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleSaveDisplay = async () => {
        if (!capturedPhoto) return;
        try {
            setIsUploading(true);

            // 1. Lấy tọa độ hiện tại của nhân viên
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') throw new Error('Cần quyền truy cập vị trí!');
            const location = await Location.getCurrentPositionAsync({});

            // 2. Lấy tọa độ cửa hàng từ DB
            const { data: store } = await supabase.from('danh_sach_cua_hang').select('lat, lng').eq('id', storeId).single();

            let distance = 0;
            if (store?.lat && store?.lng) {
                distance = calculateDistance(location.coords.latitude, location.coords.longitude, store.lat, store.lng);
            }

            // 3. Gọi service để lưu
            await DisplayService.submitDisplayPhoto(storeId, capturedPhoto.base64, Math.round(distance));

            Alert.alert('Thành công', 'Đã lưu ảnh trưng bày!', [{ text: 'Xong', onPress: () => router.back() }]);
        } catch (error: any) {
            Alert.alert('Lỗi', error.message);
        } finally { setIsUploading(false); }
    };

    return { permission, requestPermission, capturedPhoto, setCapturedPhoto, isUploading, cameraRef, handleSaveDisplay };
}