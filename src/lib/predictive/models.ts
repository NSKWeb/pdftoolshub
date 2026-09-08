import { prisma } from '@/lib/prisma';
import * as tf from '@tensorflow/tfjs-node';

export interface ModelConfig {
  modelName: string;
  modelType: 'churn' | 'revenue' | 'usage' | 'conversion';
  features: string[];
  hyperparameters?: Record<string, number>;
}

export async function createPredictiveModel(config: ModelConfig) {
  return await prisma.predictiveModels.create({
    data: {
      modelName: config.modelName,
      modelType: config.modelType,
      modelVersion: '1.0.0',
      status: 'training',
      features: config.features,
      hyperparameters: config.hyperparameters ?? {},
      deploymentStatus: 'staging'
    }
  });
}

export async function trainChurnPredictionModel() {
  // Get training data
  const subscriptions = await prisma.subscriptions.findMany({
    include: {
      user: {
        include: {
          usageLogs: true,
          files: true
        }
      },
      invoices: true
    }
  });
  
  // Prepare features
  const features: number[][] = [];
  const labels: number[] = [];
  
  for (const sub of subscriptions) {
    const usageCount = sub.user?.usageLogs?.length ?? 0;
    const fileCount = sub.user?.files?.length ?? 0;
    const daysActive = sub.currentPeriodEnd 
      ? Math.max(0, (sub.currentPeriodEnd.getTime() - sub.currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const failedPayments = sub.invoices.filter(i => i.status === 'failed').length;
    const totalPayments = sub.invoices.length;
    const paymentSuccessRate = totalPayments > 0 ? (totalPayments - failedPayments) / totalPayments : 1;
    
    features.push([
      usageCount,
      fileCount,
      daysActive,
      failedPayments,
      paymentSuccessRate,
      sub.planType === 'Enterprise' ? 1 : 0
    ]);
    
    // Label: 1 if canceled, 0 if active
    labels.push(sub.status === 'canceled' ? 1 : 0);
  }
  
  if (features.length < 10) {
    throw new Error('Insufficient training data');
  }
  
  // Create and train simple model
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [6], units: 10, activation: 'relu' }),
      tf.layers.dense({ units: 5, activation: 'relu' }),
      tf.layers.dense({ units: 1, activation: 'sigmoid' })
    ]
  });
  
  model.compile({
    optimizer: 'adam',
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });
  
  const xs = tf.tensor2d(features);
  const ys = tf.tensor2d(labels, [labels.length, 1]);
  
  await model.fit(xs, ys, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2
  });
  
  // Save model
  // In production, would save to persistent storage
  
  // Calculate accuracy
  const predictions = model.predict(xs) as tf.Tensor;
  const predArray = await predictions.array() as number[][];
  
  let correct = 0;
  for (let i = 0; i < labels.length; i++) {
    const pred = predArray[i][0] > 0.5 ? 1 : 0;
    if (pred === labels[i]) correct++;
  }
  
  const accuracy = correct / labels.length;
  
  // Update model record
  await prisma.predictiveModels.updateMany({
    where: { modelType: 'churn' },
    data: {
      accuracy,
      status: 'ready',
      lastTrainedAt: new Date(),
      trainingDataSize: features.length
    }
  });
  
  return { accuracy, trainingSize: features.length };
}

export async function predictChurnRisk(userId: string): Promise<{
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: Record<string, number>;
}> {
  // Get user data
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        include: { invoices: true }
      },
      usageLogs: true,
      files: true
    }
  });
  
  if (!user || !user.subscriptions[0]) {
    return { riskScore: 0.5, riskLevel: 'medium', factors: {} };
  }
  
  const sub = user.subscriptions[0];
  
  // Calculate risk factors
  const factors = {
    lowUsage: user.usageLogs.length < 5 ? 0.8 : 0.2,
    paymentFailures: sub.invoices.filter(i => i.status === 'failed').length * 0.2,
    lowEngagement: user.files.length < 3 ? 0.6 : 0.1,
    nearRenewal: sub.currentPeriodEnd && 
      (sub.currentPeriodEnd.getTime() - Date.now()) < (7 * 24 * 60 * 60 * 1000) ? 0.3 : 0,
    freePlan: sub.planType === 'Free' ? 0.4 : 0
  };
  
  // Simple risk calculation
  const riskScore = Math.min(1, Object.values(factors).reduce((a, b) => a + b, 0) / 2);
  
  let riskLevel: 'low' | 'medium' | 'high';
  if (riskScore >= 0.7) riskLevel = 'high';
  else if (riskScore >= 0.4) riskLevel = 'medium';
  else riskLevel = 'low';
  
  // Save prediction
  const model = await prisma.predictiveModels.findFirst({
    where: { modelType: 'churn', status: 'ready' }
  });
  
  if (model) {
    await prisma.predictions.create({
      data: {
        modelId: model.id,
        entityType: 'user',
        entityId: userId,
        predictionType: 'churn',
        predictedValue: { riskScore, riskLevel },
        confidence: 0.75,
        features: factors
      }
    });
  }
  
  return { riskScore, riskLevel, factors };
}

export async function predictRevenue(periods: number = 12): Promise<{
  predictions: Array<{ period: string; predictedRevenue: number; confidence: number }>;
  totalPredicted: number;
}> {
  // Get historical revenue data
  const historicalData = await prisma.financialReports.findMany({
    where: { reportType: 'income' },
    orderBy: { periodStart: 'asc' },
    take: 24
  });
  
  if (historicalData.length < 6) {
    throw new Error('Insufficient historical data');
  }
  
  const revenues = historicalData.map(r => r.revenue);
  
  // Simple moving average with trend
  const predictions: Array<{ period: string; predictedRevenue: number; confidence: number }> = [];
  
  // Calculate trend
  const recentAvg = revenues.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const olderAvg = revenues.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
  const trend = (recentAvg - olderAvg) / olderAvg;
  
  let currentPrediction = recentAvg;
  
  for (let i = 1; i <= periods; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    
    // Apply trend with decay
    currentPrediction = currentPrediction * (1 + trend * Math.pow(0.9, i));
    
    // Confidence decreases with time
    const confidence = Math.max(0.5, 0.9 - (i * 0.03));
    
    predictions.push({
      period: date.toISOString().slice(0, 7),
      predictedRevenue: Math.round(currentPrediction * 100) / 100,
      confidence: Math.round(confidence * 100) / 100
    });
  }
  
  // Save predictions
  const model = await prisma.predictiveModels.findFirst({
    where: { modelType: 'revenue', status: 'ready' }
  });
  
  if (model) {
    await prisma.predictions.create({
      data: {
        modelId: model.id,
        entityType: 'company',
        entityId: 'revenue_forecast',
        predictionType: 'revenue',
        predictedValue: { predictions },
        confidence: 0.8,
        features: { trend, recentAvg }
      }
    });
  }
  
  return {
    predictions,
    totalPredicted: predictions.reduce((sum, p) => sum + p.predictedRevenue, 0)
  };
}

export async function getPredictionHistory(
  entityType?: string,
  predictionType?: string,
  limit: number = 100
) {
  return await prisma.predictions.findMany({
    where: {
      entityType,
      predictionType
    },
    include: {
      model: {
        select: { modelName: true, accuracy: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

export async function getModelPerformance() {
  const models = await prisma.predictiveModels.findMany({
    where: { status: 'ready' }
  });
  
  return models.map(model => ({
    name: model.modelName,
    type: model.modelType,
    accuracy: model.accuracy,
    lastTrained: model.lastTrainedAt,
    trainingSize: model.trainingDataSize
  }));
}
