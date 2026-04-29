import { useState, useRef, useEffect } from 'react';
import { Alert, Animated } from 'react-native';
import { AuthService } from '../services/auth.service';

export function useAuth() {
  const [maNV, setMaNV] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const cardSlide = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(cardSlide, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!maNV || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập Mã nhân viên và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      await AuthService.loginWithMaNV(maNV, password);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Đã xảy ra lỗi không xác định.');
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
