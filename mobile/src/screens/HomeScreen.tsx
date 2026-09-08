import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fileService, syncService } from '../services/api';

interface File {
  id: string;
  originalFilename: string;
  fileSize: number;
  toolUsed: string;
  createdAt: string;
}

const HomeScreen = ({ navigation }: any) => {
  const [files, setFiles] = useState<File[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, recent: 0 });

  useEffect(() => {
    loadFiles();
    registerDevice();
  }, []);

  const registerDevice = async () => {
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        const newDeviceId = `device-${Date.now()}`;
        await AsyncStorage.setItem('device_id', newDeviceId);
        
        await syncService.registerDevice({
          deviceId: newDeviceId,
          platform: Platform.OS,
          appVersion: '3.0.0',
        });
      }
    } catch (error) {
      console.error('Device registration error:', error);
    }
  };

  const loadFiles = async () => {
    try {
      const response = await fileService.getFiles();
      const fileList = response.data.files || [];
      setFiles(fileList);
      setStats({
        total: fileList.length,
        recent: fileList.filter((f: File) => 
          new Date(f.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
      });
    } catch (error) {
      console.error('Load files error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dittopdf</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => navigation.navigate('Upload')}
        >
          <Icon name="cloud-upload" size={24} color="#fff" />
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Files</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.recent}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Files</Text>

        <View style={styles.fileList}>
          {files.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="folder-open" size={64} color="#64748b" />
              <Text style={styles.emptyText}>No files yet</Text>
              <Text style={styles.emptySubtext}>
                Upload your first PDF to get started
              </Text>
            </View>
          ) : (
            files.slice(0, 5).map((file) => (
              <TouchableOpacity
                key={file.id}
                style={styles.fileItem}
                onPress={() => navigation.navigate('FileDetail', { file })}
              >
                <View style={styles.fileIcon}>
                  <Icon name="insert-drive-file" size={32} color="#3b82f6" />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.originalFilename}
                  </Text>
                  <Text style={styles.fileMeta}>
                    {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color="#64748b" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {files.length > 5 && (
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Files</Text>
          </TouchableOpacity>
        )}

        <View style={styles.aiSection}>
          <Text style={styles.sectionTitle}>AI Features</Text>
          <TouchableOpacity style={styles.aiCard}>
            <View style={[styles.aiIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <Icon name="psychology" size={28} color="#8b5cf6" />
            </View>
            <View style={styles.aiInfo}>
              <Text style={styles.aiTitle}>Smart Analysis</Text>
              <Text style={styles.aiDescription}>AI-powered document insights</Text>
            </View>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#1e293b',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  fileList: {
    paddingHorizontal: 16,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  fileIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#334155',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f8fafc',
  },
  fileMeta: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  viewAllButton: {
    alignItems: 'center',
    padding: 12,
  },
  viewAllText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  aiSection: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
  },
  aiIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiInfo: {
    marginLeft: 16,
  },
  aiTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f8fafc',
  },
  aiDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
});

export default HomeScreen;
