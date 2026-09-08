import { prisma } from '../prisma';

export interface BrandingConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseSize: number;
  };
  logo: {
    url: string;
    width: number;
    height: number;
    favicon: string;
  };
  layout: {
    sidebarPosition: 'left' | 'right' | 'none';
    density: 'compact' | 'comfortable' | 'spacious';
    borderRadius: 'none' | 'small' | 'medium' | 'large';
  };
  customCss?: string;
  customJs?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

export class WhiteLabelService {
  async createTenant(
    name: string,
    subdomain: string,
    adminEmail: string,
    branding?: Partial<BrandingConfig>
  ) {
    // Create tenant
    const tenant = await prisma.tenants.create({
      data: {
        name,
        subdomain,
        branding: branding || this.getDefaultBranding(),
        settings: {
          features: {
            aiAnalysis: true,
            workflows: true,
            apiAccess: true,
            whiteLabel: true,
            sso: false,
            advancedAnalytics: true,
          },
          limits: {
            maxUsers: 100,
            maxStorage: 100, // GB
            maxWorkflows: 50,
            maxApiCalls: 100000,
          },
        },
        features: {
          enabledTools: ['merge', 'split', 'compress', 'convert', 'ocr', 'sign', 'ai'],
          customIntegrations: [],
        },
      },
    });

    // Create default roles for tenant
    await prisma.tenantRoles.createMany({
      data: [
        {
          tenantId: tenant.id,
          name: 'Admin',
          description: 'Full access to all features',
          permissions: ['*'],
          isDefault: false,
        },
        {
          tenantId: tenant.id,
          name: 'Manager',
          description: 'Can manage users and workflows',
          permissions: ['users:read', 'users:write', 'workflows:*', 'files:*', 'analytics:read'],
          isDefault: false,
        },
        {
          tenantId: tenant.id,
          name: 'User',
          description: 'Standard user access',
          permissions: ['files:*', 'workflows:read', 'workflows:execute'],
          isDefault: true,
        },
        {
          tenantId: tenant.id,
          name: 'Viewer',
          description: 'Read-only access',
          permissions: ['files:read', 'workflows:read'],
          isDefault: false,
        },
      ],
    });

    // Create default email templates
    await this.createDefaultEmailTemplates(tenant.id);

    return tenant;
  }

  async updateBranding(tenantId: string, branding: Partial<BrandingConfig>) {
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) throw new Error('Tenant not found');

    const currentBranding = (tenant.branding || {}) as BrandingConfig;

    return prisma.tenants.update({
      where: { id: tenantId },
      data: {
        branding: {
          ...currentBranding,
          ...branding,
        },
      },
    });
  }

  async getBranding(tenantId?: string, subdomain?: string): Promise<BrandingConfig> {
    if (!tenantId && !subdomain) {
      return this.getDefaultBranding();
    }

    const tenant = await prisma.tenants.findFirst({
      where: {
        OR: [
          { id: tenantId },
          { subdomain },
        ],
      },
    });

    if (!tenant) return this.getDefaultBranding();

    return (tenant.branding || this.getDefaultBranding()) as BrandingConfig;
  }

  async addCustomDomain(
    tenantId: string,
    domain: string,
    subdomain?: string
  ) {
    // Validate domain format
    if (!this.isValidDomain(domain)) {
      throw new Error('Invalid domain format');
    }

    // Check if domain is already in use
    const existing = await prisma.customDomains.findUnique({
      where: { domain },
    });

    if (existing) {
      throw new Error('Domain already in use');
    }

    return prisma.customDomains.create({
      data: {
        tenantId,
        domain,
        subdomain,
        sslStatus: 'pending',
        isActive: true,
      },
    });
  }

  async verifyDomain(domainId: string): Promise<{ verified: boolean; message: string }> {
    const domain = await prisma.customDomains.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      return { verified: false, message: 'Domain not found' };
    }

    // In production, this would:
    // 1. Check DNS records (CNAME or A record)
    // 2. Verify SSL certificate
    // 3. Update SSL status

    // Simulate verification
    await prisma.customDomains.update({
      where: { id: domainId },
      data: {
        verifiedAt: new Date(),
        sslStatus: 'active',
      },
    });

    return { verified: true, message: 'Domain verified successfully' };
  }

  async getTenantByDomain(domain: string, subdomain?: string) {
    return prisma.tenants.findFirst({
      where: {
        OR: [
          { domain },
          { subdomain },
          { customDomains: { some: { domain, isActive: true } } },
        ],
      },
      include: {
        customDomains: true,
        billingSettings: true,
      },
    });
  }

  async createEmailTemplate(
    tenantId: string,
    template: Omit<EmailTemplate, 'id'>
  ) {
    // In production, store in a dedicated email_templates table
    // For now, store in tenant settings
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) throw new Error('Tenant not found');

    const settings = (tenant.settings || {}) as any;
    const templates = settings.emailTemplates || [];

    const newTemplate: EmailTemplate = {
      ...template,
      id: `template-${Date.now()}`,
    };

    await prisma.tenants.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          emailTemplates: [...templates, newTemplate],
        },
      },
    });

    return newTemplate;
  }

  async renderEmailTemplate(
    templateId: string,
    variables: Record<string, string>,
    tenantId?: string
  ): Promise<{ subject: string; html: string; text: string }> {
    let template: EmailTemplate | undefined;

    if (tenantId) {
      const tenant = await prisma.tenants.findUnique({
        where: { id: tenantId },
      });

      if (tenant) {
        const settings = (tenant.settings || {}) as any;
        template = (settings.emailTemplates || []).find((t: EmailTemplate) => t.id === templateId);
      }
    }

    if (!template) {
      template = this.getDefaultEmailTemplates().find(t => t.id === templateId);
    }

    if (!template) {
      throw new Error('Template not found');
    }

    let subject = template.subject;
    let html = template.htmlContent;
    let text = template.textContent;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      html = html.replace(regex, value);
      text = text.replace(regex, value);
    }

    return { subject, html, text };
  }

  async getTenantStats(tenantId: string) {
    const [
      userCount,
      fileCount,
      storageUsed,
      workflowCount,
      apiCalls,
    ] = await Promise.all([
      prisma.users.count({ where: { tenantId } }),
      prisma.files.count({ where: { tenantId } }),
      prisma.files.aggregate({
        where: { tenantId },
        _sum: { fileSize: true },
      }),
      prisma.workflows.count({ where: { tenantId } }),
      prisma.analyticsEvents.count({
        where: {
          tenantId,
          eventType: 'api_call',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    const settings = (tenant?.settings || {}) as any;
    const limits = settings.limits || {};

    return {
      users: {
        total: userCount,
        limit: limits.maxUsers || 100,
        usagePercent: limits.maxUsers ? (userCount / limits.maxUsers) * 100 : 0,
      },
      files: {
        total: fileCount,
      },
      storage: {
        usedGB: ((storageUsed._sum.fileSize || 0) / (1024 * 1024 * 1024)),
        limitGB: limits.maxStorage || 100,
        usagePercent: limits.maxStorage 
          ? (((storageUsed._sum.fileSize || 0) / (1024 * 1024 * 1024)) / limits.maxStorage) * 100 
          : 0,
      },
      workflows: {
        total: workflowCount,
        limit: limits.maxWorkflows || 50,
        usagePercent: limits.maxWorkflows ? (workflowCount / limits.maxWorkflows) * 100 : 0,
      },
      api: {
        calls30Days: apiCalls,
        limit: limits.maxApiCalls || 100000,
        usagePercent: limits.maxApiCalls ? (apiCalls / limits.maxApiCalls) * 100 : 0,
      },
    };
  }

  private getDefaultBranding(): BrandingConfig {
    return {
      colors: {
        primary: '#3b82f6',
        secondary: '#6366f1',
        accent: '#10b981',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f8fafc',
        textMuted: '#94a3b8',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        baseSize: 16,
      },
      logo: {
        url: '/logo.svg',
        width: 180,
        height: 40,
        favicon: '/favicon.ico',
      },
      layout: {
        sidebarPosition: 'left',
        density: 'comfortable',
        borderRadius: 'medium',
      },
    };
  }

  private async createDefaultEmailTemplates(tenantId: string) {
    const templates = [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to {{companyName}}!',
        htmlContent: `
          <h1>Welcome to {{companyName}}!</h1>
          <p>Hi {{userName}},</p>
          <p>Your account has been created successfully. We're excited to have you on board!</p>
          <p><a href="{{loginUrl}}" style="background: {{primaryColor}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Get Started</a></p>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
        `,
        textContent: 'Welcome to {{companyName}}! Your account has been created. Visit {{loginUrl}} to get started.',
        variables: ['companyName', 'userName', 'loginUrl', 'primaryColor'],
      },
      {
        id: 'password-reset',
        name: 'Password Reset',
        subject: 'Reset your password',
        htmlContent: `
          <h1>Password Reset Request</h1>
          <p>Hi {{userName}},</p>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <p><a href="{{resetUrl}}" style="background: {{primaryColor}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
        textContent: 'Password reset requested. Visit {{resetUrl}} to reset your password.',
        variables: ['userName', 'resetUrl', 'primaryColor'],
      },
      {
        id: 'file-processed',
        name: 'File Processed',
        subject: 'Your file has been processed',
        htmlContent: `
          <h1>File Processing Complete</h1>
          <p>Hi {{userName}},</p>
          <p>Your file "{{fileName}}" has been successfully processed with {{toolUsed}}.</p>
          <p><a href="{{downloadUrl}}" style="background: {{primaryColor}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Download File</a></p>
        `,
        textContent: 'Your file {{fileName}} has been processed. Download it at {{downloadUrl}}',
        variables: ['userName', 'fileName', 'toolUsed', 'downloadUrl', 'primaryColor'],
      },
    ];

    for (const template of templates) {
      await this.createEmailTemplate(tenantId, template);
    }
  }

  private getDefaultEmailTemplates(): EmailTemplate[] {
    return [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to Dittopdf!',
        htmlContent: '<h1>Welcome!</h1><p>Thanks for joining Dittopdf.</p>',
        textContent: 'Welcome to Dittopdf!',
        variables: ['userName', 'companyName'],
      },
      {
        id: 'password-reset',
        name: 'Password Reset',
        subject: 'Reset your password',
        htmlContent: '<h1>Reset Password</h1><p>Click the link to reset your password.</p>',
        textContent: 'Visit the link to reset your password.',
        variables: ['resetUrl', 'userName'],
      },
    ];
  }

  private isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }
}

export const whiteLabelService = new WhiteLabelService();
