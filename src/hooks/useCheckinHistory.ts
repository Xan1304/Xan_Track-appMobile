import { useState, useEffect, useCallback } from 'react';
import { checkinService, FilterMonth, Staff, CheckinHistoryItem } from '../services/checkinService';

export const useCheckinHistory = () => {
  const [history, setHistory] = useState<CheckinHistoryItem[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filterMonths, setFilterMonths] = useState<FilterMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<FilterMonth | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    const months: FilterMonth[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setDate(1); // Fix rollover issue for months with fewer days
      d.setMonth(d.getMonth() - i);
      months.push({ label: `Tháng ${d.getMonth() + 1}`, month: d.getMonth(), year: d.getFullYear() });
    }
    setFilterMonths(months);
    setSelectedMonth(months[0]);
    
    checkinService.fetchStaffList().then(setStaffs).catch(console.error);
  }, []);

  const loadHistory = useCallback(async () => {
    if (!selectedMonth) return;
    try {
      setLoading(true);
      const data = await checkinService.fetchHistory(selectedMonth, selectedStaff, selectedType);
      setHistory(data);
    } catch (error: any) {
      console.error('Lỗi fetch history:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, selectedStaff, selectedType]);

  return {
    history, staffs, loading, refreshing, setRefreshing,
    filterMonths, selectedMonth, setSelectedMonth,
    selectedStaff, setSelectedStaff,
    selectedType, setSelectedType,
    loadHistory
  };
};
