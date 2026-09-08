import { prisma } from '../prisma';

export interface SamlConfig {
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: string;
  nameIdFormat?: string;
  attributeMapping?: Record<string, string>;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
  attributeMapping?: Record<string, string>;
}

export interface SsoUser {
  email: string;
  firstName?: string;
  lastName?: string;
  groups?: string[];
  attributes?: Record<string, any>;
}

export class SsoService {
  async configureSaml(
    tenantId: string,
    config: SamlConfig
  ) {
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) throw new Error('Tenant not found');

    const settings = (tenant.settings || {}) as any;

    return prisma.tenants.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          sso: {
            ...settings.sso,
            saml: {
              ...config,
              enabled: true,
            },
          },
        },
      },
    });
  }

  async configureOAuth(
    tenantId: string,
    provider: string,
    config: OAuthConfig
  ) {
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) throw new Error('Tenant not found');

    const settings = (tenant.settings || {}) as any;

    return prisma.tenants.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          sso: {
            ...settings.sso,
            oauth: {
              ...(settings.sso?.oauth || {}),
              [provider]: {
                ...config,
                enabled: true,
              },
            },
          },
        },
      },
    });
  }

  async getSsoSettings(tenantId: string) {
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) return null;

    const settings = (tenant.settings || {}) as any;
    return settings.sso || null;
  }

  async handleSamlLogin(
    tenantId: string,
    samlResponse: string
  ): Promise<{ user: any; token: string }> {
    // In production, use passport-saml to validate and parse SAML response
    // For now, simulate the process

    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) throw new Error('Tenant not found');

    const settings = (tenant.settings || {}) as any;
    const samlConfig = settings.sso?.saml;

    if (!samlConfig?.enabled) {
      throw new Error('SAML not configured for this tenant');
    }

    // Parse SAML response and extract user attributes
    // This is a simplified version - actual implementation would use proper SAML library
    const ssoUser = this.parseSamlResponse(samlResponse, samlConfig);

    // Find or create user
    let user = await prisma.users.findFirst({
      where: {
        email: ssoUser.email,
        tenantId,
      },
    });

    if (!user) {
      // Auto-provision user
      user = await prisma.users.create({
        data: {
          email: ssoUser.email,
          passwordHash: 'sso-user', // Mark as SSO user
          tenantId,
          planType: 'Enterprise',
        },
      });

      // Assign default role
      const defaultRole = await prisma.tenantRoles.findFirst({
        where: { tenantId, isDefault: true },
      });

      if (defaultRole) {
        await prisma.userTenantRoles.create({
          data: {
            userId: user.id,
            tenantId,
            roleId: defaultRole.id,
          },
        });
      }
    }

    // Generate session token
    const token = await this.generateSessionToken(user.id);

    // Log the login
    await prisma.auditLogs.create({
      data: {
        userId: user.id,
        tenantId,
        action: 'sso_login',
        entityType: 'user',
        entityId: user.id,
        newValues: { method: 'saml' },
      },
    });

    return { user, token };
  }

  async handleOAuthCallback(
    tenantId: string,
    provider: string,
    code: string
  ): Promise<{ user: any; token: string }> {
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) throw new Error('Tenant not found');

    const settings = (tenant.settings || {}) as any;
    const oauthConfig = settings.sso?.oauth?.[provider];

    if (!oauthConfig?.enabled) {
      throw new Error(`OAuth ${provider} not configured for this tenant`);
    }

    // Exchange code for tokens
    // In production, make actual OAuth token exchange request
    const tokens = await this.exchangeOAuthCode(code, oauthConfig);

    // Get user info from OAuth provider
    const userInfo = await this.getOAuthUserInfo(tokens.access_token, oauthConfig);

    // Map attributes
    const ssoUser = this.mapOAuthAttributes(userInfo, oauthConfig.attributeMapping);

    // Find or create user
    let user = await prisma.users.findFirst({
      where: {
        email: ssoUser.email,
        tenantId,
      },
    });

    if (!user) {
      user = await prisma.users.create({
        data: {
          email: ssoUser.email,
          passwordHash: 'oauth-user',
          tenantId,
          planType: 'Enterprise',
        },
      });

      const defaultRole = await prisma.tenantRoles.findFirst({
        where: { tenantId, isDefault: true },
      });

      if (defaultRole) {
        await prisma.userTenantRoles.create({
          data: {
            userId: user.id,
            tenantId,
            roleId: defaultRole.id,
          },
        });
      }
    }

    const token = await this.generateSessionToken(user.id);

    await prisma.auditLogs.create({
      data: {
        userId: user.id,
        tenantId,
        action: 'oauth_login',
        entityType: 'user',
        entityId: user.id,
        newValues: { provider, method: 'oauth' },
      },
    });

    return { user, token };
  }

  async getUserRoles(userId: string, tenantId: string): Promise<string[]> {
    const userRoles = await prisma.userTenantRoles.findFirst({
      where: {
        userId,
        tenantId,
      },
      include: {
        role: true,
      },
    });

    if (!userRoles) return [];

    return userRoles.role.permissions;
  }

  async checkPermission(
    userId: string,
    tenantId: string,
    permission: string
  ): Promise<boolean> {
    const roles = await this.getUserRoles(userId, tenantId);

    // Check for wildcard permission
    if (roles.includes('*')) return true;

    // Check for exact permission
    if (roles.includes(permission)) return true;

    // Check for wildcard in resource type (e.g., 'files:*' matches 'files:read')
    const [resource] = permission.split(':');
    if (roles.includes(`${resource}:*`)) return true;

    return false;
  }

  async assignRole(
    userId: string,
    tenantId: string,
    roleId: string,
    assignedBy: string
  ) {
    // Remove existing role assignment
    await prisma.userTenantRoles.deleteMany({
      where: {
        userId,
        tenantId,
      },
    });

    // Create new role assignment
    return prisma.userTenantRoles.create({
      data: {
        userId,
        tenantId,
        roleId,
        assignedBy,
      },
    });
  }

  async createRole(
    tenantId: string,
    name: string,
    description: string,
    permissions: string[]
  ) {
    return prisma.tenantRoles.create({
      data: {
        tenantId,
        name,
        description,
        permissions,
      },
    });
  }

  async generateSamlMetadata(tenantId: string): Promise<string> {
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) throw new Error('Tenant not found');

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dittopdf.com';
    const acsUrl = `${baseUrl}/api/auth/saml/${tenant.subdomain}/acs`;
    const entityId = `${baseUrl}/tenants/${tenant.subdomain}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}">
  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acsUrl}" index="1"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
  }

  private parseSamlResponse(response: string, config: SamlConfig): SsoUser {
    // In production, use proper SAML parsing library
    // This is a simplified placeholder
    return {
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'Name',
      groups: ['users'],
    };
  }

  private async exchangeOAuthCode(code: string, config: OAuthConfig): Promise<{ access_token: string }> {
    // In production, make actual HTTP request to OAuth token endpoint
    return { access_token: 'placeholder-token' };
  }

  private async getOAuthUserInfo(accessToken: string, config: OAuthConfig): Promise<Record<string, any>> {
    // In production, make actual HTTP request to user info endpoint
    return { email: 'user@example.com', name: 'User Name' };
  }

  private mapOAuthAttributes(userInfo: Record<string, any>, mapping?: Record<string, string>): SsoUser {
    const defaultMapping = {
      email: 'email',
      firstName: 'given_name',
      lastName: 'family_name',
      groups: 'groups',
    };

    const attrMap = { ...defaultMapping, ...mapping };

    return {
      email: userInfo[attrMap.email],
      firstName: userInfo[attrMap.firstName],
      lastName: userInfo[attrMap.lastName],
      groups: userInfo[attrMap.groups] || [],
      attributes: userInfo,
    };
  }

  private async generateSessionToken(userId: string): Promise<string> {
    // Use existing session/token generation
    const { generateToken } = await import('../session');
    return generateToken(userId);
  }
}

export const ssoService = new SsoService();
