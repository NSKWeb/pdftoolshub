# Dittopdf - Global Enterprise PDF Platform

A production-ready AI-powered SaaS platform with 25+ PDF tools, enterprise features, mobile apps, advanced automation, and global infrastructure capabilities. Now with marketplace ecosystem, IPO-ready financials, and enterprise-grade security.

## 🚀 Phase 6: Ultimate Market Domination & Autonomous Operations

Dittopdf now operates as a fully autonomous business entity with AI-driven decision making, ecosystem dominance, industry standard setting, and self-managing post-IPO operations. The platform has achieved ultimate market position through autonomous business intelligence, competitive superiority, and global expansion automation.

### Previous Phases
- **Phase 5**: Quantum computing, blockchain, and IPO readiness
- **Phase 4**: Global platform with marketplace and predictive analytics
- **Phase 3**: AI-powered features and workflow automation
- **Phase 2**: Enterprise features with OCR and batch processing
- **Phase 1**: Core PDF tools and user authentication

## ✨ Features

### Core PDF Tools (25+)

**Basic Tools:**
- Merge PDFs - Combine multiple files into one
- Split PDF - Extract pages or ranges
- Compress PDF - Reduce file size
- Rotate PDF - Rotate pages by 90°/180°/270°
- Reorder Pages - Rearrange page order
- Delete Pages - Remove specific pages

**Conversion Tools:**
- PDF to Office - Convert to Word, Excel, PowerPoint
- PDF to Images - Export as JPG or PNG
- Images to PDF - Convert JPG/PNG to PDF
- PDF to Text - Extract text from PDFs
- PDF/A Export - Archive format conversion
- PDF/X Export - Print-ready format

**Security & Editing:**
- Password Protect PDF - Encrypt with password
- Remove Password - Remove password protection
- Text Watermark - Add text watermark
- Image Watermark - Add image/logo watermark
- Text Annotations - Add notes and highlights
- Extract Pages - Pull specific pages
- Extract Images - Download embedded images
- Edit Metadata - Edit title, author, subject

### 🤖 AI-Powered Features

- **AI Document Analysis** - Intelligent content analysis using GPT-4
- **Smart Summarization** - Automatic document summarization
- **Entity Extraction** - Extract names, dates, amounts, organizations
- **Document Classification** - Auto-categorize documents (invoice, contract, resume, etc.)
- **Content Optimization** - AI-powered improvement suggestions
- **Quality Assessment** - Automated quality scoring
- **Layout Suggestions** - Design and formatting recommendations
- **Similarity Matching** - Find related documents
- **Q&A System** - Ask questions about document content

### 🔄 Workflow Automation

- **Visual Workflow Designer** - Drag-and-drop workflow builder
- **Automated Pipelines** - Trigger-based document processing
- **Conditional Logic** - Branch workflows based on conditions
- **Template Library** - Pre-built workflow templates
- **Integration Triggers** - Email, webhook, schedule, API-based triggers

### 🏢 Enterprise Features

- **Multi-Tenant Architecture** - Complete tenant isolation
- **White-Label Solution** - Custom branding and domains
- **Single Sign-On (SSO)** - SAML 2.0 and OAuth 2.0 support
- **Role-Based Access Control** - Granular permissions system
- **Advanced Security** - SOC 2, GDPR, HIPAA compliance tools
- **Audit Logging** - Comprehensive activity tracking
- **Custom Integrations** - Salesforce, SharePoint, Google Workspace

### 📱 Mobile Applications

- **Native iOS & Android Apps** - Built with React Native
- **Offline Mode** - Work without internet connection
- **Biometric Authentication** - Face ID and Touch ID
- **Cloud Sync** - Automatic synchronization
- **Push Notifications** - Real-time workflow alerts
- **Mobile-Optimized Viewer** - Enhanced PDF viewing experience

### 💰 Billing & Analytics

- **Flexible Pricing** - Free, Pro, Business, Enterprise tiers
- **Usage-Based Billing** - Metered billing for enterprises
- **Advanced Analytics** - Business intelligence dashboards
- **Predictive Insights** - Usage forecasting and trends
- **White-Label Billing** - Custom invoicing for enterprises

### 🌍 Phase 4: Global Platform Features

**Global Infrastructure:**
- **Multi-Region Deployment** - AWS, Azure, GCP support
- **Global CDN** - Edge computing and caching
- **Automatic Failover** - 99.99% uptime architecture
- **Geo-Routing** - Latency-optimized routing

**Advanced AI Automation:**
- **Intelligent Document Classification** - ML-powered categorization
- **Smart Document Routing** - Rule-based automation
- **AI Quality Assurance** - Automated quality checks
- **Predictive Processing** - ML model predictions

**Marketplace Platform:**
- **Plugin Ecosystem** - Third-party integrations
- **Developer Portal** - SDK and documentation
- **Revenue Sharing** - 70/30 developer split
- **Verified Reviews** - Installation-based verification

**Enterprise Security:**
- **Compliance Certifications** - ISO 27001, FedRAMP, HIPAA
- **Advanced Fraud Detection** - Real-time risk scoring
- **Behavioral Analytics** - User profiling
- **Automated Incident Response** - Security orchestration

**IPO-Ready Financials:**
- **GAAP Reporting** - Compliant financial statements
- **Investor Dashboard** - Real-time KPIs
- **Revenue Recognition** - Automated accounting
- **Audit Trail** - Complete transaction history

**Customer Success:**
- **Health Scoring** - Predictive churn analysis
- **AI Support Automation** - Ticket classification
- **At-Risk Detection** - Proactive intervention
- **SLA Monitoring** - Performance tracking

## 🛠 Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS 3.4
- **Database:** PostgreSQL with Prisma ORM
- **PDF Processing:** pdf-lib, Tesseract.js
- **AI/ML:** OpenAI GPT-4, TensorFlow.js, TensorFlow Node
- **Authentication:** JWT with bcrypt, Passport.js
- **Storage:** AWS S3 / Azure Blob / GCP Storage / Cloudinary
- **Queue:** BullMQ (Redis) for background jobs
- **Payments:** Stripe, QuickBooks
- **Mobile:** React Native 0.72
- **Security:** Helmet, CORS, Rate Limiting, Circuit Breakers
- **Monitoring:** Prometheus, Jaeger, Winston
- **Search:** Elasticsearch
- **Streaming:** Kafka
- **Resilience:** Opossum (Circuit Breakers)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dittopdf
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dittopdf
JWT_SECRET=your_secure_jwt_secret_here

# Storage (choose one or use local storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# OR Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AdSense (optional)
ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxx

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Set up the database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Core Tables

**Users**
- `id` - Unique identifier (CUID)
- `email` - User email (unique)
- `passwordHash` - Bcrypt hashed password
- `tenantId` - Associated tenant (for enterprise)
- `role` - User role
- `planType` - User plan (Free/Pro/Business/Enterprise)
- `twoFactorEnabled` - 2FA status
- `createdAt`, `updatedAt` - Timestamps

**Files**
- `id` - Unique identifier (CUID)
- `userId`, `tenantId` - Ownership
- `originalFilename`, `processedFilename` - File names
- `fileSize` - Size in bytes
- `toolUsed` - Processing tool
- `classification` - AI document category
- `tags` - Auto-generated tags
- `aiAnalysis` - AI analysis results
- `status` - Processing status

**Tenants (Enterprise)**
- `id` - Unique identifier
- `name`, `domain`, `subdomain` - Tenant identifiers
- `branding` - White-label configuration
- `settings` - Feature flags and limits
- `planType` - Enterprise plan

### AI & Automation Tables

**AiJobs** - AI analysis jobs
- `userId`, `fileId` - Associated resources
- `jobType` - Type of analysis
- `aiModel` - GPT-4 or other models
- `inputData`, `outputData` - Job data
- `confidenceScore`, `processingTime` - Metrics
- `tokensUsed`, `cost` - Usage tracking

**Workflows** - Automation workflows
- `userId`, `tenantId` - Ownership
- `name`, `description` - Workflow info
- `definition` - Node/edge configuration
- `triggers` - Activation triggers
- `isActive`, `isTemplate` - Status flags

**WorkflowRuns** - Workflow executions
- `workflowId` - Parent workflow
- `status` - Execution status
- `progress` - Completion percentage
- `inputData`, `outputData` - Run data

### Enterprise Tables

**ComplianceLogs** - Compliance tracking
- `action`, `resourceType` - What happened
- `complianceStatus` - GDPR, SOC2 status
- `regulationType` - Which regulation
- `ipAddress`, `userAgent` - Context

**AuditLogs** - Comprehensive audit trail
- `action`, `entityType`, `entityId` - Event details
- `oldValues`, `newValues` - Change tracking

**TenantRoles** - RBAC roles
- `tenantId` - Associated tenant
- `name`, `permissions` - Role configuration

**UserTenantRoles** - User role assignments

### Mobile Tables

**MobileDevices** - Registered devices
- `userId` - Device owner
- `deviceId`, `platform` - Device info
- `pushToken` - Push notification token
- `lastActiveAt` - Activity tracking

### Billing Tables

**Subscriptions** - Subscription management
- `stripeCustomerId`, `stripeSubscriptionId` - Stripe IDs
- `planType`, `status` - Subscription info
- `usageLimits`, `features` - Plan configuration

**Invoices** - Billing records
- `subscriptionId` - Associated subscription
- `amount`, `currency`, `status` - Payment details

**BillingMeters** - Usage metering
- `metricType`, `metricValue` - Usage data
- `periodStart`, `periodEnd` - Billing period

### Analytics Tables

**AnalyticsEvents** - Event tracking
- `eventType`, `eventName` - Event details
- `properties` - Event metadata

**AnalyticsDashboards** - Custom dashboards

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Tools
- `POST /api/tools/[tool]` - Process PDF with tool

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/history` - Get user file history

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard stats

### User
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update user profile

### API v3 - AI & Enterprise

**AI Analysis:**
- `POST /api/v3/ai/analyze` - AI document analysis
- `POST /api/v3/ai/compare` - Compare documents
- `POST /api/v3/ai/ask` - Document Q&A

**Document Classification:**
- `POST /api/v3/classify/document` - Classify and tag documents
- `GET /api/v3/classify/document` - Get classified documents

**Workflows:**
- `POST /api/v3/workflows` - Create workflow
- `GET /api/v3/workflows` - List workflows
- `POST /api/v3/workflows/{id}/run` - Execute workflow

**Tenant Management:**
- `POST /api/v3/tenant` - Create tenant
- `GET /api/v3/tenant` - Get tenant info

**White-Label:**
- `GET /api/v3/white-label/branding` - Get branding
- `POST /api/v3/white-label/branding` - Update branding
- `POST /api/v3/white-label/domain` - Add custom domain

**SSO:**
- `GET /api/v3/tenant/sso` - Get SSO settings
- `POST /api/v3/tenant/sso` - Configure SSO

**Compliance:**
- `GET /api/v3/compliance/audit` - Get audit logs
- `GET /api/v3/compliance/report` - Compliance reports

**Billing:**
- `GET /api/v3/billing/subscription` - Get subscription
- `POST /api/v3/billing/subscription` - Create subscription
- `GET /api/v3/billing/usage` - Get usage metrics

**Integrations:**
- `GET /api/v3/integrations` - List integrations
- `POST /api/v3/integrations` - Add integration
- `POST /api/v3/integrations/{id}/sync` - Sync integration

**Mobile:**
- `POST /api/v3/mobile/device` - Register device
- `GET /api/v3/mobile/device` - List devices
- `POST /api/v3/mobile/sync` - Sync files

**Business Intelligence:**
- `GET /api/v3/bi/dashboard` - Get analytics dashboard

See [API_V3.md](./API_V3.md) for complete v3 API documentation.

### API v4 - Global Platform

**Global Infrastructure:**
- `GET /api/v4/global/regions` - List regions
- `POST /api/v4/global/regions` - Create region
- `GET /api/v4/global/cdn` - CDN nodes and stats

**AI Automation:**
- `GET /api/v4/ai-automation/jobs` - List automation jobs
- `POST /api/v4/ai-automation/jobs` - Create automation job

**Marketplace:**
- `GET /api/v4/marketplace/plugins` - List plugins
- `POST /api/v4/marketplace/plugins` - Publish plugin
- `GET /api/v4/marketplace/plugins/:slug` - Plugin details
- `POST /api/v4/marketplace/plugins/:slug/install` - Install plugin
- `POST /api/v4/marketplace/plugins/:slug/reviews` - Add review

**Compliance:**
- `GET /api/v4/compliance/certifications` - List certifications
- `POST /api/v4/compliance/certifications` - Add certification

**Business Intelligence:**
- `GET /api/v4/bi/predictions` - Get predictions
- `POST /api/v4/bi/predictions` - Train ML models
- `GET /api/v4/bi/executive-dashboards` - Executive dashboards

**Customer Success:**
- `GET /api/v4/customer-success/health` - Health scores
- `GET /api/v4/customer-success/tickets` - Support tickets
- `POST /api/v4/customer-success/tickets` - Create ticket

**Microservices:**
- `GET /api/v4/microservices/routes` - API gateway routes
- `POST /api/v4/microservices/routes` - Create route

**Security:**
- `POST /api/v4/security/fraud` - Fraud risk check
- `GET /api/v4/security/fraud` - Fraud statistics

**Financial:**
- `GET /api/v4/financial/reports` - Financial reports
- `POST /api/v4/financial/reports` - Generate report

See [PHASE4.md](./PHASE4.md) for complete Phase 4 documentation.

### API v5 - Ultimate Enterprise

**Quantum Computing:**
- `GET /api/v5/quantum` - Quantum processing metrics
- `POST /api/v5/quantum` - Execute quantum algorithm

**Blockchain:**
- `GET /api/v5/blockchain` - Verification records
- `POST /api/v5/blockchain` - Verify document on-chain

**Advanced AI Models:**
- `GET /api/v5/ai-models` - List custom AI models
- `POST /api/v5/ai-models` - Deploy new model

**Autonomous Systems:**
- `GET /api/v5/autonomous` - System health status
- `POST /api/v5/autonomous` - Configure self-healing

**IPO Readiness:**
- `GET /api/v5/ipo` - Investor relations data
- `POST /api/v5/ipo` - Generate financial reports

See [PHASE5.md](./PHASE5.md) for complete Phase 5 documentation.

### API v6 - Autonomous Business Operations

**Autonomous Business:**
- `GET /api/v6/autonomous-business` - Decision history and metrics
- `POST /api/v6/autonomous-business` - Execute AI business decision

**Ecosystem Control:**
- `GET /api/v6/ecosdominance` - Platform dominance metrics
- `POST /api/v6/ecosdominance` - Register ecosystem platform

**Market Acquisition:**
- `GET /api/v6/market-acquisition` - Acquisition campaigns
- `POST /api/v6/market-acquisition` - Launch market acquisition

**Strategic Partnerships:**
- `GET /api/v6/strategic-partnerships` - Partnership portfolio
- `POST /api/v6/strategic-partnerships` - Create partnership

**Competitive Intelligence:**
- `GET /api/v6/competitive-intelligence` - Intelligence reports
- `POST /api/v6/competitive-intelligence` - Analyze competitor

**Industry Standards:**
- `GET /api/v6/industry-standards` - Standards and adoption
- `POST /api/v6/industry-standards` - Define new standard

**Revenue Optimization:**
- `GET /api/v6/revenue-optimization` - Revenue metrics
- `POST /api/v6/revenue-optimization` - Optimize revenue stream

**Global Expansion:**
- `GET /api/v6/global-expansion` - Expansion initiatives
- `POST /api/v6/global-expansion` - Launch expansion

**Post-IPO Operations:**
- `GET /api/v6/post-ipo` - Quarterly metrics and operations
- `POST /api/v6/post-ipo` - Record autonomous operation

See [PHASE6.md](./PHASE6.md) for complete Phase 6 documentation.

## Usage Limits

### Free Plan
- 5 files per day
- Max 25MB file size
- Basic PDF tools only
- Files deleted after 1 hour

### Pro Plan ($19/month)
- Unlimited files
- Max 50MB file size
- All PDF tools
- OCR & e-signatures
- 50 AI analyses/month
- 5 workflows
- 10GB storage

### Business Plan ($49/month)
- Everything in Pro
- Max 100MB file size
- 200 AI analyses/month
- 20 workflows
- 25GB storage
- API access
- Team collaboration

### Enterprise Plan ($199/month)
- Everything in Business
- Max 250MB file size
- Unlimited AI analysis
- Unlimited workflows
- Unlimited storage
- Multi-tenant support
- White-label options
- SSO integration
- Custom contracts
- Dedicated support

## Deployment

### Build for production

```bash
npm run build
npm run start
```

### Environment Variables for Production

Make sure to set all required environment variables in your production environment:

**Core:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secure secret for JWT signing
- `NODE_ENV=production`

**AI Services:**
- `OPENAI_API_KEY` - OpenAI API key for GPT-4

**Storage:**
- Storage provider credentials (AWS S3 or Cloudinary)

**Payments:**
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS`, `STRIPE_PRICE_ENTERPRISE` - Price IDs

**SSO:**
- `SAML_CERT` - SAML certificate
- OAuth provider credentials

**Mobile Push Notifications:**
- `FCM_SERVER_KEY` - Firebase Cloud Messaging server key
- `APN_KEY_PATH`, `APN_KEY_ID`, `APN_TEAM_ID` - Apple Push Notification credentials

**Integrations:**
- `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### Recommended Platforms

- Vercel (recommended for Next.js)
- Railway
- Render
- AWS (ECS, Elastic Beanstalk)
- Google Cloud Platform
- Azure

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token-based authentication with session management
- Rate limiting on API endpoints
- File type and size validation
- Automatic file cleanup
- Protected routes with middleware
- CORS protection
- **SOC 2 Type II compliance tools**
- **GDPR compliance features**
- **Audit logging and compliance reporting**
- **Advanced encryption at rest and in transit**
- **Role-based access control (RBAC)**
- **Two-factor authentication support**
- **IP-based access restrictions**

## AdSense Integration

Google AdSense is integrated with placeholder components. To enable:

1. Set `ADSENSE_CLIENT_ID` in your environment variables
2. The ad slots will automatically load AdSense
3. Positions: header, sidebar, footer
4. Pro users can upgrade to remove ads

## Project Structure

```
dittopdf/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # API routes
│   │   │   ├── auth/        # Authentication (v1)
│   │   │   ├── v2/          # Phase 2 API (OCR, batch, signatures)
│   │   │   └── v3/          # Phase 3 API (AI, enterprise)
│   │   ├── auth/            # Authentication pages
│   │   ├── dashboard/       # User dashboard
│   │   ├── tools/           # PDF tool pages
│   │   └── downloads/       # File downloads
│   ├── components/          # React components
│   └── lib/                 # Utility libraries
│       ├── ai/              # AI services (OpenAI, TensorFlow)
│       ├── analytics/       # Business intelligence
│       ├── billing/         # Stripe integration
│       ├── compliance/      # Audit & compliance
│       ├── integrations/    # Enterprise integrations
│       ├── mobile/          # Mobile app services
│       ├── tenant/          # Multi-tenant & white-label
│       └── workflow/        # Automation engine
├── prisma/
│   └── schema.prisma        # Database schema
├── mobile/                  # React Native mobile app
│   ├── src/
│   │   ├── components/      # Mobile components
│   │   ├── screens/         # App screens
│   │   ├── services/        # API services
│   │   └── store/           # Redux store
│   ├── android/             # Android-specific
│   └── ios/                 # iOS-specific
├── public/                  # Static assets
├── API_V3.md                # Phase 3 API documentation
└── .env.example             # Environment variables template
```

## Development

### Available Scripts

**Web Application:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

**Mobile Application:**
- `npm run mobile:ios` - Run iOS app
- `npm run mobile:android` - Run Android app

**AI Services:**
- `npm run ai:train` - Train AI classification models

### Adding New Tools

1. Add tool to `src/lib/tools.ts`
2. Implement tool logic in `src/lib/pdf-tools.ts`
3. Tool automatically becomes available at `/tools/[slug]`

### Adding AI Features

1. Add analysis type to `src/lib/ai/openai.ts`
2. Create prompt template
3. Add API endpoint in `src/app/api/v3/ai/`
4. Update frontend components

## License

Copyright © 2024 Dittopdf. All rights reserved.

## Support

For issues, questions, or contributions, please contact the development team.
