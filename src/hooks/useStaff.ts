import { useState, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { StaffService } from '../services/staff.service';

export function useStaff() {
  const [staff, setStaff] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [routeModalVisible, setRouteModalVisible] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [requestData, setRequestData] = useState({ ho_ten: '', email: '', so_dien_thoai: '' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [staffData, routesData] = await Promise.all([
        StaffService.fetchStaff(),
        StaffService.fetchRoutes()
      ]);
      setStaff(staffData);
      setRoutes(routesData);
    } catch (e: any) {
      console.log('Lỗi tải dữ liệu nhân viên/tuyến:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAssignRoute = async (routeId: string) => {
    try {
      if (!selectedStaff) return;
      await StaffService.assignRoute(selectedStaff.id, routeId);
      
      setRouteModalVisible(false);
      setDetailModalVisible(false);
      loadData();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const handleDeleteStaff = async (id: string, tuyenId: string | null) => {
    Alert.alert(
      'Xác nhận thôi việc',
      `Cho nhân viên ${selectedStaff?.ho_ten} nghỉ việc?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await StaffService.deleteStaff(id, tuyenId);
              
              setStaff(prev => prev.filter(item => item.id !== id));
              setDetailModalVisible(false);
            } catch (e: any) {
              Alert.alert('Lỗi', 'Không thể xử lý. Vui lòng thử lại.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const sendEmailRequest = () => {
    if (!requestData.ho_ten || !requestData.email) {
      return Alert.alert('Thiếu thông tin', 'Nhập đủ họ tên và email.');
    }
    
    const adminEmail = 'admin@xantrack.com';
    const subject = encodeURIComponent('Yêu cầu tạo nhân viên mới - XAN Milk');
    const body = encodeURIComponent(`Yêu cầu tạo mới:\n- Họ tên: ${requestData.ho_ten}\n- Email: ${requestData.email}\n- SĐT: ${requestData.so_dien_thoai}`);
    
    Linking.openURL(`mailto:${adminEmail}?subject=${subject}&body=${body}`)
      .catch(() => Alert.alert('Lỗi', 'Không thể mở ứng dụng Email.'));
      
    setRequestModalVisible(false);
  };

  return {
    staff,
    routes,
    loading,
    requestModalVisible,
    setRequestModalVisible,
    detailModalVisible,
    setDetailModalVisible,
    routeModalVisible,
    setRouteModalVisible,
    selectedStaff,
    setSelectedStaff,
    requestData,
    setRequestData,
    handleAssignRoute,
    handleDeleteStaff,
    sendEmailRequest
  };
}
