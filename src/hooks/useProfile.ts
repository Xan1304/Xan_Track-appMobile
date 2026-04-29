import { useState, useEffect } from 'react';
import { AuthService } from '../services/auth.service';

export function useProfile() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await AuthService.getProfile();
        setProfile(data);
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return {
    profile,
    handleLogout
  };
}
