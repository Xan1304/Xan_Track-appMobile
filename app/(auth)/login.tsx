import React from 'react';
import {
  Text, TextInput, TouchableOpacity, View, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const {
    maNV,
    setMaNV,
    password,
    setPassword,
    loading,
    showPassword,
    setShowPassword,
    focusedField,
    setFocusedField,
    fadeAnim,
    slideAnim,
    logoScale,
    cardSlide,
    handleLogin
  } = useAuth();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />
      <View style={styles.blobCenter} />

      <View style={styles.dotGrid} pointerEvents="none">
        {Array.from({ length: 80 }).map((_, i) => (
          <View key={i} style={styles.dot} />
        ))}
      </View>

      <View style={styles.inner}>
        <Animated.View style={[styles.brandBlock, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <MaterialCommunityIcons name="shield-check" size={30} color="#fff" />
            </View>
          </View>
          <View style={styles.brandText}>
            <Text style={styles.brandName}>XAN<Text style={styles.brandAccent}>Track</Text></Text>
            <Text style={styles.brandTagline}>Ứng dụng hỗ trợ chấm công và quản lí doanh thu</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: cardSlide }] }]}>
          <View style={styles.cardStrip}>
            <Text style={styles.cardTitle}>Đăng nhập</Text>
            <Text style={styles.cardHint}>Nhập thông tin tài khoản của bạn</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.fields}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Mã nhân viên</Text>
              <View style={[styles.inputWrap, focusedField === 'manv' && styles.inputWrapFocused]}>
                <View style={[styles.inputIcon, focusedField === 'manv' && styles.inputIconFocused]}>
                  <Ionicons name="id-card-outline" size={17} color={focusedField === 'manv' ? '#fff' : '#94a3b8'} />
                </View>
                <TextInput
                  value={maNV}
                  onChangeText={setMaNV}
                  autoCapitalize="characters"
                  placeholderTextColor="#c0ccd8"
                  style={styles.textInput}
                  onFocus={() => setFocusedField('manv')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Mật khẩu</Text>
              <View style={[styles.inputWrap, focusedField === 'pw' && styles.inputWrapFocused]}>
                <View style={[styles.inputIcon, focusedField === 'pw' && styles.inputIconFocused]}>
                  <Ionicons name="lock-closed-outline" size={17} color={focusedField === 'pw' ? '#fff' : '#94a3b8'} />
                </View>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#c0ccd8"
                  style={styles.textInput}
                  onFocus={() => setFocusedField('pw')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[styles.loginBtn, loading && styles.loginBtnLoading]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
                <View style={styles.loginArrow}>
                  <Ionicons name="arrow-forward" size={16} color="#1a3a6b" />
                </View>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>© 2026 Công Ty XAN MILK</Text>
          <View style={styles.footerDot} />
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const NAVY = '#1a3a6b';
const BLUE = '#2f74fa';
const NAVY_LIGHT = '#2a4e8f';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef2fa' },
  blobTopRight: { position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: BLUE, opacity: 0.12 },
  blobBottomLeft: { position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: NAVY, opacity: 0.1 },
  blobCenter: { position: 'absolute', top: height * 0.35, left: width * 0.4, width: 180, height: 180, borderRadius: 90, backgroundColor: BLUE, opacity: 0.05 },
  dotGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', flexWrap: 'wrap', gap: 28, padding: 24, opacity: 0.25 },
  dot: { width: 2.5, height: 2.5, borderRadius: 1.5, backgroundColor: NAVY },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 24 },
  brandBlock: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 4 },
  logoRing: { width: 64, height: 64, borderRadius: 20, borderWidth: 2, borderColor: `${NAVY}30`, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', shadowColor: NAVY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  logoInner: { width: 48, height: 48, borderRadius: 14, backgroundColor: NAVY, justifyContent: 'center', alignItems: 'center' },
  brandText: { flex: 1 },
  brandName: { fontSize: 28, fontWeight: '800', color: NAVY, letterSpacing: -0.5 },
  brandAccent: { color: BLUE, fontWeight: '300' },
  brandTagline: { fontSize: 11, color: '#94a3b8', fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 28, overflow: 'hidden', shadowColor: NAVY, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 10, borderWidth: 1, borderColor: `${NAVY}10` },
  cardStrip: { backgroundColor: NAVY, paddingHorizontal: 24, paddingVertical: 20 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  cardHint: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4, fontWeight: '400' },
  divider: { height: 3, backgroundColor: BLUE },
  fields: { padding: 24, gap: 20 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 0.8, textTransform: 'uppercase' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', overflow: 'hidden', height: 54 },
  inputWrapFocused: { borderColor: BLUE, backgroundColor: '#f0f6ff' },
  inputIcon: { width: 46, height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  inputIconFocused: { backgroundColor: BLUE },
  textInput: { flex: 1, fontSize: 15, color: '#0f172a', fontWeight: '500', paddingRight: 12 },
  eyeBtn: { paddingHorizontal: 14, height: '100%', justifyContent: 'center' },
  loginBtn: { marginHorizontal: 24, marginBottom: 24, height: 54, backgroundColor: NAVY, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: NAVY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  loginBtnLoading: { backgroundColor: NAVY_LIGHT, opacity: 0.8 },
  loginBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
  loginArrow: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  footerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1' },
  footerText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
});
