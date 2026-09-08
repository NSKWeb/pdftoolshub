import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { billingService, SUBSCRIPTION_PLANS } from '@/lib/billing/stripe';
import { verifyToken } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const subscription = await prisma.subscriptions.findFirst({
      where: { userId },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json({
      plans: SUBSCRIPTION_PLANS,
      subscription,
    });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, paymentMethodId } = body;

    if (!planId) {
      return NextResponse.json(
        { message: 'Plan ID required' },
        { status: 400 }
      );
    }

    const result = await billingService.createSubscription(
      userId,
      planId,
      paymentMethodId
    );

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      clientSecret: result.clientSecret,
    });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { action, planId } = body;

    const subscription = await prisma.subscriptions.findFirst({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { message: 'No active subscription' },
        { status: 404 }
      );
    }

    if (action === 'cancel') {
      const result = await billingService.cancelSubscription(
        subscription.stripeSubscriptionId,
        body.atPeriodEnd !== false
      );
      return NextResponse.json({ success: true, subscription: result });
    }

    if (action === 'update' && planId) {
      const result = await billingService.updateSubscription(
        subscription.stripeSubscriptionId,
        planId
      );
      return NextResponse.json({ success: true, subscription: result });
    }

    return NextResponse.json(
      { message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
