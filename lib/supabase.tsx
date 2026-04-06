// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lgimegmaeaebsgpygnyt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaW1lZ21hZWFlYnNncHlnbnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTcxNzYsImV4cCI6MjA4MzEzMzE3Nn0.B5grDCA6RV7_kwAEfjuyfMikg9zoHV5GoyiCv-ErLMw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});