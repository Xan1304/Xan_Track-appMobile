import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { getMonthlyAttendance } from '../../../src/services/attendance.service';
import { useAuth } from '../../../src/hooks/useAuth';
import { supabase } from '../../../src/services/supabase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
  monthNamesShort: ['Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6', 'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12'],
  dayNames: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
  dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  today: 'Hôm nay'
};
LocaleConfig.defaultLocale = 'vi';

export default function CalendarScreen() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && user.email) {
        setUserEmail(user.email);
      }
    });
  }, []);

  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [dailyActivities, setDailyActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [dailyCong, setDailyCong] = useState<number>(0);
  const [completePairs, setCompletePairs] = useState<number>(0);


  const fetchDailyActivities = async (dateStr: string) => {
    if (!userEmail) return;
    try {
      setLoadingActivities(true);
      setDailyActivities([]);
      const [year, month, day] = dateStr.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0).toISOString();
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59).toISOString();

      const { data: checkins, error: checkinErr } = await supabase
        .from('lich_su_checkin')
        .select(`
          id,
          loai_hinh,
          thoi_gian,
          cua_hang_id,
          danh_sach_cua_hang(ten_cua_hang)
        `)
        .eq('nhan_vien_email', userEmail)
        .gte('thoi_gian', startOfDay)
        .lte('thoi_gian', endOfDay)
        .order('thoi_gian', { ascending: true });

      if (checkinErr) throw checkinErr;

      const hasBienBan = checkins?.some(c => c.loai_hinh === 'bien_ban');
      let ordersMap: any = {};
      
      if (hasBienBan) {
        const { data: orders, error: orderErr } = await supabase
          .from('don_hang_doanh_thu')
          .select('cua_hang_id, tong_tien')
          .eq('nhan_vien_email', userEmail)
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay);

        if (!orderErr && orders) {
          orders.forEach(o => {
            if (o.cua_hang_id) ordersMap[o.cua_hang_id] = o.tong_tien;
          });
        }
      }

      const activities = (checkins || []).map(item => ({
        ...item,
        tong_tien: item.loai_hinh === 'bien_ban' && item.cua_hang_id ? ordersMap[item.cua_hang_id] : undefined
      }));

      setDailyActivities(activities);

      let pairsCount = 0;
      if (checkins && checkins.length > 0) {
        const groupedByStore: Record<string, any[]> = {};
        checkins.forEach(c => {
          if (c.cua_hang_id) {
            if (!groupedByStore[c.cua_hang_id]) groupedByStore[c.cua_hang_id] = [];
            groupedByStore[c.cua_hang_id].push(c);
          }
        });

        Object.values(groupedByStore).forEach(storeCheckins => {
          const hasCheckin = storeCheckins.some(c => c.loai_hinh === 'checkin');
          const hasCheckout = storeCheckins.some(c => c.loai_hinh === 'checkout');
          if (hasCheckin && hasCheckout) {
            pairsCount++;
          }
        });
      }
      
      setCompletePairs(pairsCount);
      setDailyCong(Math.min(1, Math.floor(pairsCount / 3)));
    } catch (error: any) {
      console.log('Lỗi fetchDailyActivities:', error.message);
    } finally {
      setLoadingActivities(false);
    }
  };

  const getMarkedDates = () => {
    const finalMarked: any = { ...markedDates };
    if (selectedDateStr) {
      finalMarked[selectedDateStr] = {
        ...finalMarked[selectedDateStr],
        selected: true,
        selectedColor: '#1a3a6b',
      };
    }
    return finalMarked;
  };

  const fetchAttendance = async (year: number, month: number) => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const data = await getMonthlyAttendance(userEmail, year, month);
      setMarkedDates(data);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu chấm công.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [userEmail, currentDate]);

  const now = new Date();
  const maxDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const minD = new Date();
  minD.setDate(1);
  minD.setMonth(minD.getMonth() - 2);
  const minDateStr = `${minD.getFullYear()}-${String(minD.getMonth() + 1).padStart(2, '0')}-01`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bảng công cá nhân</Text>
      </View>
      <View style={styles.calendarContainer}>
        <Calendar
          minDate={minDateStr}
          maxDate={maxDateStr}
          current={currentDate.toISOString().split('T')[0]}
          onMonthChange={(month: any) => setCurrentDate(new Date(month.timestamp))}
          markedDates={getMarkedDates()}
          onDayPress={(day: any) => {
            const dateStr = day.dateString;
            setSelectedDateStr(dateStr);
            fetchDailyActivities(dateStr);
          }}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#1a3a6b',
            selectedDayBackgroundColor: '#1a3a6b',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#2f74fa',
            dayTextColor: '#0f172a',
            textDisabledColor: '#94a3b8',
            monthTextColor: '#1a3a6b',
            arrowColor: '#1a3a6b',
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600'
          }}
          displayLoadingIndicator={loading}
        />
      </View>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.colorBox, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Đủ công</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.colorBox, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>Thiếu công</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.colorBox, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>Nghỉ phép</Text>
        </View>
      </View>

      {/* Attendance Summary */}
      {!loadingActivities && selectedDateStr && (
        <View style={styles.attendanceCard}>
          <View style={styles.attendanceIcon}>
            <Ionicons name="checkmark-circle" size={32} color={dailyCong >= 1 ? '#16a34a' : '#94a3b8'} />
          </View>
          <View style={styles.attendanceInfo}>
            <Text style={styles.attendanceCong}>{dailyCong} công</Text>
            <Text style={styles.attendanceDesc}>{completePairs} / 3 cửa hàng hoàn thành</Text>
          </View>
        </View>
      )}

      {/* Timeline Section */}
      <View style={styles.timelineContainer}>
        {selectedDateStr && (
          <Text style={styles.timelineTitle}>
            Hoạt động ngày {selectedDateStr.split('-').reverse().join('/')}
          </Text>
        )}
        
        {loadingActivities ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color="#1a3a6b" />
          </View>
        ) : selectedDateStr ? (
          dailyActivities.length > 0 ? (
            <FlatList
              data={dailyActivities}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const timeStr = new Date(item.thoi_gian).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const storeName = item.danh_sach_cua_hang?.ten_cua_hang || 'Cửa hàng không rõ';
                
                let iconNode = null;
                if (item.loai_hinh === 'checkin') {
                  iconNode = <MaterialCommunityIcons name="login" size={20} color="#22c55e" />;
                } else if (item.loai_hinh === 'checkout') {
                  iconNode = <MaterialCommunityIcons name="logout" size={20} color="#f59e0b" />;
                } else if (item.loai_hinh === 'trung_bay') {
                  iconNode = <Ionicons name="camera-outline" size={20} color="#3b82f6" />;
                } else if (item.loai_hinh === 'bien_ban') {
                  iconNode = <Ionicons name="receipt-outline" size={20} color="#8b5cf6" />;
                } else {
                  iconNode = <Ionicons name="ellipse" size={14} color="#94a3b8" />;
                }

                return (
                  <View style={styles.activityCard}>
                    <View style={styles.activityIconBox}>{iconNode}</View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityStore}>{storeName}</Text>
                      <View style={styles.activityMetaRow}>
                        <Text style={styles.activityTime}>{timeStr}</Text>
                        <Text style={styles.activityType}>
                          {item.loai_hinh === 'checkin' ? 'Vào cửa hàng' :
                           item.loai_hinh === 'checkout' ? 'Ra cửa hàng' :
                           item.loai_hinh === 'trung_bay' ? 'Chụp trưng bày' :
                           item.loai_hinh === 'bien_ban' ? 'Lên đơn hàng' : item.loai_hinh}
                        </Text>
                      </View>
                    </View>
                    {item.loai_hinh === 'bien_ban' && item.tong_tien !== undefined && (
                      <View style={styles.activityRight}>
                        <Text style={styles.activityPrice}>
                          {Number(item.tong_tien).toLocaleString('vi-VN')}đ
                        </Text>
                      </View>
                    )}
                  </View>
                );
              }}
            />
          ) : (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>Không có hoạt động nào trong ngày này.</Text>
            </View>
          )
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8' },
  header: {
    paddingHorizontal: 18, paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  calendarContainer: { margin: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#ffffff', elevation: 10, shadowColor: '#1a3a6b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  legendContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: '#ffffff', marginHorizontal: 16, borderRadius: 12, elevation: 5, shadowColor: '#1a3a6b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  colorBox: { width: 16, height: 16, borderRadius: 4, marginRight: 8 },
  legendText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  
  attendanceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 14, marginHorizontal: 14, marginTop: 16, marginBottom: 10,
  },
  attendanceIcon: { marginRight: 12 },
  attendanceInfo: { flex: 1 },
  attendanceCong: { fontSize: 18, fontWeight: '700', color: '#1a3a6b', marginBottom: 2 },
  attendanceDesc: { fontSize: 13, color: '#64748b' },


  timelineContainer: { flex: 1, paddingHorizontal: 16, marginTop: 16 },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: '#1a3a6b', marginBottom: 12 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#94a3b8', fontStyle: 'italic' },
  activityCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 14, marginBottom: 10,
  },
  activityIconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: { flex: 1 },
  activityStore: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  activityMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activityTime: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  activityType: { fontSize: 12, color: '#94a3b8' },
  activityRight: { alignItems: 'flex-end', marginLeft: 8 },
  activityPrice: { fontSize: 14, fontWeight: '700', color: '#1a3a6b' }
});
