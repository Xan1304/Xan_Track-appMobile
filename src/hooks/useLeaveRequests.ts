import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { LeaveService } from '../services/leave.service';

export function useLeaveRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await LeaveService.fetchRequests();
      setRequests(data);
    } catch (e: any) {
      Alert.alert('Lỗi kết nối', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAction = async (id: string, status: 'da_duyet' | 'tu_choi', name: string) => {
    const isApprove = status === 'da_duyet';
    Alert.alert(
      isApprove ? 'Duyệt đơn nghỉ phép' : 'Từ chối đơn',
      `${isApprove ? 'Duyệt' : 'Từ chối'} đơn nghỉ của ${name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: isApprove ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await LeaveService.updateRequestStatus(id, status);
              fetchRequests();
            } catch (e: any) {
              Alert.alert('Lỗi', e.message);
            }
          }
        }
      ]
    );
  };

  const pendingCount = requests.filter(r => r.trang_thai === 'cho_duyet').length;

  return {
    requests,
    loading,
    pendingCount,
    fetchRequests,
    handleAction
  };
}
