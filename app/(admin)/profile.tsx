import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const NAVY = '#1a3a6b';

const getInitials = (fullName: string) => {
  if (!fullName) return 'NV';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('ho_so_nhan_vien').select('*').eq('email', user.email).single();
        setProfile(data);
      }
    };
    getProfile();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
      </View>

      {/* Avatar section */}
      <View style={styles.profileHero}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(profile?.ho_ten)}</Text>
          </View>
          <View style={styles.statusDot} />
        </View>
        <Text style={styles.name}>{profile?.ho_ten || '...'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{profile?.chuc_vu || 'Nhân viên'}</Text>
          {profile?.ma_nhan_vien && (
            <>
              <View style={styles.roleDivider} />
              <Text style={styles.roleText}>{profile.ma_nhan_vien}</Text>
            </>
          )}
        </View>
      </View>

      {/* Info cards */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionLabel}>Thông tin liên hệ</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#f0f4ff' }]}>
              <Ionicons name="mail-outline" size={18} color={NAVY} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile?.email || '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="call-outline" size={18} color="#16a34a" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{profile?.so_dien_thoai || 'Chưa cập nhật'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={() => supabase.auth.signOut()}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
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

  profileHero: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 28,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: NAVY,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(26,58,107,0.2)',
  },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '600', letterSpacing: 0.5 },
  statusDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2.5, borderColor: '#fff',
  },
  name: { fontSize: 20, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f0f4ff', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: { fontSize: 12, color: NAVY, fontWeight: '500' },
  roleDivider: { width: 1, height: 12, backgroundColor: 'rgba(26,58,107,0.2)', marginHorizontal: 8 },

  infoSection: { padding: 14 },
  sectionLabel: {
    fontSize: 10, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.7, color: '#94a3b8',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
    padding: 4,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  infoIcon: {
    width: 36, height: 36, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#0f172a', fontWeight: '500' },
  divider: { height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: 12 },

  footer: { marginTop: 'auto', padding: 14, paddingBottom: 20 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 15, borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 0.5, borderColor: 'rgba(239,68,68,0.3)',
  },
  logoutText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
});