import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { billingService, syncService } from '../services/api';

const ProfileScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    loadUserData();
    loadSubscription();
  }, []);

  const loadUserData = async () => {
    const userData = await AsyncStorage.getItem('user_data');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const loadSubscription = async () => {
    try {
      const response = await billingService.getSubscription();
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error('Load subscription error:', error);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
    // Navigate to login
  };

  const handleSync = async () => {
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      if (deviceId) {
        await syncService.syncFiles(deviceId);
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const menuItems = [
    { icon: 'cloud-sync', title: 'Sync Now', action: handleSync },
    { icon: 'folder-shared', title: 'Shared with Me', action: () => {} },
    { icon: 'notifications', title: 'Notifications', action: () => {} },
    { icon: 'security', title: 'Security', action: () => {} },
    { icon: 'help', title: 'Help & Support', action: () => {} },
    { icon: 'info', title: 'About', action: () => {} },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Icon name="person" size={48} color="#3b82f6" />
          </View>
          <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
          <View style={styles.planBadge}>
            <Text style={styles.planText}>
              {subscription?.planType || 'Free'} Plan
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="fingerprint" size={24} color="#94a3b8" />
              <Text style={styles.settingText}>Biometric Login</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#334155', true: '#3b82f6' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name="offline-bolt" size={24} color="#94a3b8" />
              <Text style={styles.settingText}>Offline Mode</Text>
            </View>
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              trackColor={{ false: '#334155', true: '#3b82f6' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.action}
            >
              <View style={styles.menuLeft}>
                <Icon name={item.icon} size={24} color="#94a3b8" />
                <Text style={styles.menuText}>{item.title}</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#64748b" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#1e293b',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#1e293b',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: '#334155',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  planBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  planText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  section: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#f8fafc',
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#f8fafc',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
});

export default ProfileScreen;
