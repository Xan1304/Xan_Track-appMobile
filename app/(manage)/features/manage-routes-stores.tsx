import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ManageRoutes from './manage-routes';
import ManageStores from './manage-stores';

export default function ManageRoutesStores() {
  const [activeTab, setActiveTab] = useState<'routes' | 'stores'>('routes');

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', margin: 14, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 3 }}>
          <TouchableOpacity
            style={[{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
              activeTab === 'routes' && { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }]}
            onPress={() => setActiveTab('routes')}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: activeTab === 'routes' ? '#0f172a' : '#94a3b8' }}>Tuyến bán hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
              activeTab === 'stores' && { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }]}
            onPress={() => setActiveTab('stores')}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: activeTab === 'stores' ? '#0f172a' : '#94a3b8' }}>Cửa hàng</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <View style={{ flex: 1 }}>
        {activeTab === 'routes' ? <ManageRoutes /> : <ManageStores />}
      </View>
    </View>
  );
}
