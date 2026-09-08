import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/session';
import {
  predictChurnRisk,
  predictRevenue,
  getPredictionHistory,
  getModelPerformance,
  trainChurnPredictionModel
} from '@/lib/predictive/models';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const entityType = searchParams.get('entityType');
    const predictionType = searchParams.get('predictionType');
    const models = searchParams.get('models');
    const history = searchParams.get('history');

    if (models === 'true') {
      if (user.role !== 'admin' && user.role !== 'data') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      const performance = await getModelPerformance();
      return NextResponse.json({ models: performance });
    }

    if (history === 'true') {
      const predictions = await getPredictionHistory(
        entityType ?? undefined,
        predictionType ?? undefined
      );
      return NextResponse.json({ predictions });
    }

    if (type === 'revenue') {
      if (user.role !== 'admin' && user.role !== 'finance') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      const periods = parseInt(searchParams.get('periods') ?? '12');
      const predictions = await predictRevenue(periods);
      return NextResponse.json({ predictions });
    }

    if (type === 'churn') {
      const userId = searchParams.get('userId') ?? user.id;
      
      // Users can only get their own churn prediction
      if (userId !== user.id && user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      const prediction = await predictChurnRisk(userId);
      return NextResponse.json({ prediction });
    }

    return NextResponse.json(
      { error: 'Invalid prediction type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'train') {
      const { modelType } = body;
      
      if (modelType === 'churn') {
        const result = await trainChurnPredictionModel();
        return NextResponse.json({
          message: 'Model training completed',
          result
        });
      }
      
      return NextResponse.json(
        { error: 'Invalid model type' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error training model:', error);
    return NextResponse.json(
      { error: 'Failed to train model' },
      { status: 500 }
    );
  }
}
