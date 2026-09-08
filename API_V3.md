# Dittopdf API v3 Documentation

## Phase 3: AI-Powered Enterprise Platform

### Base URL
```
https://dittopdf.com/api/v3
```

## Authentication

All API v3 endpoints require authentication via JWT token:
```
Authorization: Bearer <your_token>
```

---

## AI-Powered Analysis

### POST `/ai/analyze`

Analyze documents using AI models.

**Request:**
```json
{
  "fileId": "optional-file-id",
  "content": "optional-direct-content",
  "analysisType": "summarize|extract_entities|classify|optimize|quality_check|layout_suggestions|content_analysis",
  "options": {
    "language": "en",
    "detailLevel": "brief|standard|detailed"
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysisType": "summarize",
  "result": {
    "summary": "Document summary...",
    "confidence": 0.95,
    "keyPoints": ["..."]
  }
}
```

### POST `/ai/compare`

Compare two documents for similarities and differences.

**Request:**
```json
{
  "doc1Content": "...",
  "doc2Content": "...",
  "file1Id": "optional",
  "file2Id": "optional"
}
```

### POST `/ai/ask`

Ask questions about document content.

**Request:**
```json
{
  "fileId": "file-id",
  "question": "What is the main topic?"
}
```

---

## Document Classification

### POST `/classify/document`

Classify documents and auto-tag them.

**Request:**
```json
{
  "fileId": "file-id",
  "content": "document content",
  "findSimilar": true,
  "threshold": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "classification": {
    "category": "invoice",
    "confidence": 0.94,
    "tags": ["financial-data", "urgent"],
    "subcategories": ["recurring"]
  },
  "similarDocuments": [...]
}
```

---

## Workflow Automation

### POST `/workflows`

Create a new workflow.

**Request:**
```json
{
  "name": "Invoice Processing",
  "description": "Auto-process incoming invoices",
  "definition": {
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "label": "File Uploaded",
        "config": { "event": "file_uploaded" }
      },
      {
        "id": "action-1",
        "type": "action",
        "label": "Classify Document",
        "config": { "actionType": "classify" }
      }
    ],
    "edges": [
      { "id": "edge-1", "source": "trigger-1", "target": "action-1" }
    ]
  },
  "triggers": [
    { "type": "file_uploaded", "config": {} }
  ],
  "isTemplate": false,
  "category": "automation"
}
```

### POST `/workflows/{id}/run`

Execute a workflow.

**Request:**
```json
{
  "fileId": "optional-file-id",
  "inputData": { "key": "value" }
}
```

### GET `/workflows/{id}/run`

Get workflow execution history.

---

## Multi-Tenant Management

### POST `/tenant`

Create a new enterprise tenant.

**Request:**
```json
{
  "name": "Acme Corp",
  "subdomain": "acme",
  "branding": {
    "colors": { "primary": "#3b82f6", ... },
    "logo": { "url": "...", ... }
  }
}
```

### GET `/tenant`

Get current tenant information and stats.

---

## White-Label & Customization

### GET `/white-label/branding`

Get branding configuration.

**Query Parameters:**
- `tenantId` (optional)
- `subdomain` (optional)

### POST `/white-label/branding`

Update branding configuration.

**Request:**
```json
{
  "tenantId": "tenant-id",
  "branding": {
    "colors": { "primary": "#3b82f6", ... },
    "typography": { "headingFont": "Inter", ... }
  }
}
```

### POST `/white-label/domain`

Add a custom domain.

**Request:**
```json
{
  "tenantId": "tenant-id",
  "domain": "pdf.acme.com",
  "subdomain": "optional"
}
```

### PATCH `/white-label/domain`

Verify domain configuration.

---

## Single Sign-On (SSO)

### GET `/tenant/sso`

Get SSO configuration.

### POST `/tenant/sso`

Configure SSO.

**Request (SAML):**
```json
{
  "tenantId": "tenant-id",
  "type": "saml",
  "config": {
    "entityId": "https://acme.com",
    "ssoUrl": "https://acme.com/saml/sso",
    "certificate": "..."
  }
}
```

**Request (OAuth):**
```json
{
  "tenantId": "tenant-id",
  "type": "oauth",
  "config": {
    "provider": "google",
    "clientId": "...",
    "clientSecret": "...",
    "scopes": ["openid", "email", "profile"]
  }
}
```

---

## Compliance & Audit

### GET `/compliance/audit`

Get audit logs.

**Query Parameters:**
- `action` - Filter by action type
- `entityType` - Filter by entity type
- `startDate` - Start date filter
- `endDate` - End date filter

### POST `/compliance/audit`

Log an audit event.

### GET `/compliance/report`

Get compliance reports.

**Query Parameters:**
- `type` - `full`, `checks`, `gdpr`, `soc2`, `ccpa`

---

## Billing & Subscriptions

### GET `/billing/subscription`

Get subscription details and available plans.

### POST `/billing/subscription`

Create or update subscription.

**Request:**
```json
{
  "planId": "pro|business|enterprise",
  "paymentMethodId": "optional-payment-method"
}
```

### PATCH `/billing/subscription`

Modify subscription.

**Request:**
```json
{
  "action": "cancel|update",
  "planId": "new-plan-id",
  "atPeriodEnd": true
}
```

### GET `/billing/usage`

Get usage metrics and limits.

---

## Enterprise Integrations

### GET `/integrations`

List configured integrations.

### POST `/integrations`

Configure a new integration.

**Request:**
```json
{
  "provider": "salesforce|sharepoint|google_workspace|teams|slack",
  "type": "read|write|sync",
  "credentials": { ... },
  "settings": { ... }
}
```

### POST `/integrations/{id}/sync`

Trigger integration sync.

### GET `/integrations/{id}/sync`

Test integration connection.

---

## Mobile API

### POST `/mobile/device`

Register a mobile device.

**Request:**
```json
{
  "deviceId": "unique-device-id",
  "platform": "ios|android",
  "appVersion": "3.0.0",
  "pushToken": "optional-fcm-apns-token",
  "deviceModel": "iPhone14,2",
  "osVersion": "16.0"
}
```

### GET `/mobile/device`

Get registered devices and stats.

### POST `/mobile/sync`

Sync files for offline access.

### GET `/mobile/sync`

Get offline data bundle.

---

## Business Intelligence

### GET `/bi/dashboard`

Get analytics dashboard data.

**Query Parameters:**
- `type` - `metrics`, `predictive`, `executive`
- `period` - Number of days (default: 30)

### POST `/bi/dashboard`

Create custom dashboard.

---

## Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| AI Analysis | 50 | 1 hour |
| Workflow Runs | 100 | 1 hour |
| API Calls | Based on plan | 1 minute |
| File Uploads | Based on plan | 1 minute |

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Plan limit exceeded |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Webhooks

Configure webhooks to receive real-time events:

### Event Types
- `file.processed` - File processing complete
- `workflow.completed` - Workflow finished
- `ai.analysis.completed` - AI analysis finished
- `user.created` - New user registered
- `subscription.updated` - Subscription changed

### Webhook Payload
```json
{
  "event": "file.processed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "fileId": "...",
    "userId": "...",
    "status": "success"
  }
}
```
