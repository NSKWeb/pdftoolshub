import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://dittopdf.com/api/v3';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

// AI Services
export const aiService = {
  analyzeDocument: (fileId: string, analysisType: string, content?: string) =>
    api.post('/ai/analyze', { fileId, analysisType, content }),
  
  compareDocuments: (doc1Content: string, doc2Content: string) =>
    api.post('/ai/compare', { doc1Content, doc2Content }),
  
  askQuestion: (fileId: string, question: string) =>
    api.post('/ai/ask', { fileId, question }),
};

// File Services
export const fileService = {
  uploadFile: (formData: FormData) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getFiles: () => api.get('/files/history'),
  
  downloadFile: (fileId: string) => api.get(`/files/download/${fileId}`),
  
  deleteFile: (fileId: string) => api.delete(`/files/${fileId}`),
  
  processFile: (tool: string, data: any) =>
    api.post(`/tools/${tool}`, data),
};

// Workflow Services
export const workflowService = {
  getWorkflows: () => api.get('/workflows'),
  
  createWorkflow: (data: any) => api.post('/workflows', data),
  
  runWorkflow: (workflowId: string, inputData: any) =>
    api.post(`/workflows/${workflowId}/run`, inputData),
  
  getWorkflowRuns: (workflowId: string) =>
    api.get(`/workflows/${workflowId}/run`),
};

// Mobile Sync Services
export const syncService = {
  registerDevice: (deviceInfo: any) =>
    api.post('/mobile/device', deviceInfo),
  
  syncFiles: (deviceId: string, lastSyncTimestamp?: string) =>
    api.post('/mobile/sync', { deviceId, lastSyncTimestamp }),
  
  getOfflineData: () => api.get('/mobile/sync'),
};

// Billing Services
export const billingService = {
  getSubscription: () => api.get('/billing/subscription'),
  
  createSubscription: (planId: string, paymentMethodId?: string) =>
    api.post('/billing/subscription', { planId, paymentMethodId }),
  
  getUsage: () => api.get('/billing/usage'),
};

export default api;
