import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { workflowService } from '../services/api';

interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

const WorkflowsScreen = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await workflowService.getWorkflows();
      setWorkflows(response.data.workflows || []);
    } catch (error) {
      console.error('Load workflows error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkflows();
    setRefreshing(false);
  };

  const renderWorkflow = ({ item }: { item: Workflow }) => (
    <TouchableOpacity style={styles.workflowCard}>
      <View style={styles.workflowHeader}>
        <Icon name="account-tree" size={24} color="#10b981" />
        <View style={[styles.statusBadge, { 
          backgroundColor: item.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)'
        }]}>
          <Text style={[styles.statusText, { 
            color: item.isActive ? '#10b981' : '#94a3b8'
          }]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <Text style={styles.workflowName}>{item.name}</Text>
      <Text style={styles.workflowDescription} numberOfLines={2}>
        {item.description || 'No description'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workflows</Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={workflows}
        keyExtractor={(item) => item.id}
        renderItem={renderWorkflow}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="account-tree" size={64} color="#64748b" />
            <Text style={styles.emptyText}>No workflows yet</Text>
            <Text style={styles.emptySubtext}>
              Create automated document processing pipelines
            </Text>
          </View>
        }
      />
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
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#3b82f6',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  workflowCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  workflowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workflowName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  workflowDescription: {
    fontSize: 14,
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
});

export default WorkflowsScreen;
