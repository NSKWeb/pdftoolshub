import Stripe from 'stripe';
import { prisma } from '../prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    filesPerDay: number;
    maxFileSize: number;
    storageGB: number;
    apiCallsPerMonth: number;
    workflows: number;
    aiAnalysis: number;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'For individuals getting started',
    price: 0,
    currency: 'usd',
    interval: 'month',
    features: [
      '5 files per day',
      '25MB max file size',
      'Basic PDF tools',
      'Email support',
    ],
    limits: {
      filesPerDay: 5,
      maxFileSize: 25 * 1024 * 1024,
      storageGB: 1,
      apiCallsPerMonth: 100,
      workflows: 0,
      aiAnalysis: 0,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For power users',
    price: 19,
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited files',
      '50MB max file size',
      'All PDF tools',
      'OCR & e-signatures',
      'Batch processing',
      'Priority support',
      '5 workflows',
      '50 AI analyses/month',
    ],
    limits: {
      filesPerDay: -1,
      maxFileSize: 50 * 1024 * 1024,
      storageGB: 10,
      apiCallsPerMonth: 10000,
      workflows: 5,
      aiAnalysis: 50,
    },
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For small teams',
    price: 49,
    currency: 'usd',
    interval: 'month',
    features: [
      'Everything in Pro',
      '100MB max file size',
      '25GB storage',
      '20 workflows',
      '200 AI analyses/month',
      'Team collaboration',
      'Advanced analytics',
      'API access',
      'Custom integrations',
    ],
    limits: {
      filesPerDay: -1,
      maxFileSize: 100 * 1024 * 1024,
      storageGB: 25,
      apiCallsPerMonth: 50000,
      workflows: 20,
      aiAnalysis: 200,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For organizations',
    price: 199,
    currency: 'usd',
    interval: 'month',
    features: [
      'Everything in Business',
      '250MB max file size',
      'Unlimited storage',
      'Unlimited workflows',
      'Unlimited AI analysis',
      'Multi-tenant support',
      'White-label options',
      'SSO integration',
      'Custom contracts',
      'Dedicated support',
      'SLA guarantees',
    ],
    limits: {
      filesPerDay: -1,
      maxFileSize: 250 * 1024 * 1024,
      storageGB: -1,
      apiCallsPerMonth: -1,
      workflows: -1,
      aiAnalysis: -1,
    },
  },
];

export class BillingService {
  async createCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer> {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });

    return customer;
  }

  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId?: string
  ): Promise<{ subscription: Stripe.Subscription; clientSecret?: string }> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { subscriptions: true },
    });

    if (!user) throw new Error('User not found');

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) throw new Error('Invalid plan');

    // Get or create Stripe customer
    let customerId = user.subscriptions[0]?.stripeCustomerId;
    
    if (!customerId) {
      const customer = await this.createCustomer(userId, user.email);
      customerId = customer.id;
    }

    // Attach payment method if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: this.getStripePriceId(planId) }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Store in database
    await prisma.subscriptions.create({
      data: {
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        planType: planId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        usageLimits: plan.limits,
        features: plan.features,
      },
    });

    // Update user plan
    await prisma.users.update({
      where: { id: userId },
      data: { planType: plan.name },
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent;

    return {
      subscription,
      clientSecret: paymentIntent?.client_secret || undefined,
    };
  }

  async cancelSubscription(subscriptionId: string, atPeriodEnd: boolean = true): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: atPeriodEnd,
    });

    await prisma.subscriptions.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: { 
        cancelAtPeriodEnd: atPeriodEnd,
        status: subscription.status,
      },
    });

    return subscription;
  }

  async updateSubscription(subscriptionId: string, newPlanId: string): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === newPlanId);
    
    if (!plan) throw new Error('Invalid plan');

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: this.getStripePriceId(newPlanId),
      }],
    });

    await prisma.subscriptions.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        planType: newPlanId,
        usageLimits: plan.limits,
        features: plan.features,
      },
    });

    return updatedSubscription;
  }

  async getInvoices(userId: string) {
    const subscription = await prisma.subscriptions.findFirst({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) return [];

    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 100,
    });

    return invoices.data;
  }

  async recordUsage(userId: string, metricType: string, value: number = 1): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    await prisma.billingMeters.create({
      data: {
        userId,
        metricType,
        metricValue: value,
        periodStart,
        periodEnd,
      },
    });
  }

  async checkUsageLimit(userId: string, metricType: string): Promise<{ allowed: boolean; remaining: number; total: number }> {
    const subscription = await prisma.subscriptions.findFirst({
      where: { userId },
    });

    if (!subscription) {
      return { allowed: false, remaining: 0, total: 0 };
    }

    const limits = subscription.usageLimits as Record<string, number>;
    const limit = limits[metricType] || 0;

    if (limit === -1) {
      return { allowed: true, remaining: -1, total: -1 };
    }

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const usage = await prisma.billingMeters.aggregate({
      where: {
        userId,
        metricType,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
      _sum: { metricValue: true },
    });

    const used = usage._sum.metricValue || 0;
    const remaining = Math.max(0, limit - used);

    return {
      allowed: remaining > 0,
      remaining,
      total: limit,
    };
  }

  async getUsageReport(userId: string, startDate: Date, endDate: Date) {
    const usage = await prisma.billingMeters.groupBy({
      by: ['metricType'],
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { metricValue: true },
    });

    return usage.map(u => ({
      metricType: u.metricType,
      totalUsage: u._sum.metricValue || 0,
    }));
  }

  async createUsageRecord(subscriptionItemId: string, quantity: number): Promise<Stripe.UsageRecord> {
    return stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'increment',
    });
  }

  async handleWebhook(payload: string, signature: string): Promise<void> {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) return;

    await prisma.invoices.create({
      data: {
        subscriptionId: invoice.subscription as string,
        userId: await this.getUserIdFromCustomer(invoice.customer as string),
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: 'paid',
        paidAt: new Date(),
        description: invoice.description,
      },
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) return;

    await prisma.invoices.create({
      data: {
        subscriptionId: invoice.subscription as string,
        userId: await this.getUserIdFromCustomer(invoice.customer as string),
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        status: 'failed',
        description: invoice.description,
      },
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    await prisma.subscriptions.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await prisma.subscriptions.update({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: 'canceled' },
    });

    // Downgrade to free plan
    const subscriptionRecord = await prisma.subscriptions.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (subscriptionRecord) {
      await prisma.users.update({
        where: { id: subscriptionRecord.userId },
        data: { planType: 'Free' },
      });
    }
  }

  private async getUserIdFromCustomer(customerId: string): Promise<string> {
    const subscription = await prisma.subscriptions.findFirst({
      where: { stripeCustomerId: customerId },
    });
    return subscription?.userId || '';
  }

  private getStripePriceId(planId: string): string {
    const priceIds: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_PRO || '',
      business: process.env.STRIPE_PRICE_BUSINESS || '',
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
    };
    return priceIds[planId] || '';
  }
}

export const billingService = new BillingService();
