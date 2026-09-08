import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const tools = [
  { id: 'merge', name: 'Merge PDFs', icon: 'call-merge', color: '#3b82f6' },
  { id: 'split', name: 'Split PDF', icon: 'call-split', color: '#10b981' },
  { id: 'compress', name: 'Compress', icon: 'compress', color: '#f59e0b' },
  { id: 'rotate', name: 'Rotate', icon: 'rotate-right', color: '#8b5cf6' },
  { id: 'ocr', name: 'OCR Scan', icon: 'document-scanner', color: '#ec4899' },
  { id: 'protect', name: 'Protect', icon: 'lock', color: '#ef4444' },
  { id: 'watermark', name: 'Watermark', icon: 'branding-watermark', color: '#06b6d4' },
  { id: 'annotate', name: 'Annotate', icon: 'edit', color: '#84cc16' },
];

const ToolsScreen = () => {
  const handleToolPress = (toolId: string) => {
    // Navigate to tool screen
    console.log('Tool pressed:', toolId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PDF Tools</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.grid}>
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.toolCard}
              onPress={() => handleToolPress(tool.id)}
            >
              <View style={[styles.iconContainer, { backgroundColor: tool.color }]}>
                <Icon name={tool.icon} size={32} color="#fff" />
              </View>
              <Text style={styles.toolName}>{tool.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.aiSection}>
          <Text style={styles.sectionTitle}>AI Features</Text>
          <TouchableOpacity style={styles.aiCard}>
            <Icon name="psychology" size={32} color="#8b5cf6" />
            <View style={styles.aiInfo}>
              <Text style={styles.aiTitle}>AI Analysis</Text>
              <Text style={styles.aiDescription}>
                Get intelligent insights from your documents
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.aiCard}>
            <Icon name="auto-fix-high" size={32} color="#10b981" />
            <View style={styles.aiInfo}>
              <Text style={styles.aiTitle}>Smart Classify</Text>
              <Text style={styles.aiDescription}>
                Auto-categorize and tag documents
              </Text>
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
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  toolCard: {
    width: '25%',
    padding: 8,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolName: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  aiSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  aiInfo: {
    marginLeft: 16,
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  aiDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
});

export default ToolsScreen;
