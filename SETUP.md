# Dittopdf Setup Guide

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up the database:**
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. **Run the development server:**
```bash
npm run dev
```

## Environment Variables

### Required

- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://user:password@localhost:5432/dittopdf`
- `JWT_SECRET` - Secret key for JWT token signing
  - Generate a secure random string

### Optional (Storage)

Choose one storage provider:

**AWS S3:**
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `AWS_S3_BUCKET` - S3 bucket name

**Cloudinary:**
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

**Note:** If neither is configured, files are stored locally in `.uploads/` directory.

### Optional (Monetization)

- `NEXT_PUBLIC_ADSENSE_CLIENT_ID` - Google AdSense client ID

### Configuration

- `NEXT_PUBLIC_SITE_URL` - Site URL (default: http://localhost:3000)

## Database Setup

### PostgreSQL

Make sure PostgreSQL is installed and running:

```bash
# On Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start

# Create database
sudo -u postgres createdb dittopdf
```

### Run Migrations

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

### Project Structure

```
dittopdf/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   └── lib/            # Utility functions
├── prisma/
│   └── schema.prisma    # Database schema
└── public/              # Static files
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Other Platforms

```bash
# Build the project
npm run build

# Start production server
npm run start
```

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### File Upload Issues

- Check storage credentials (AWS/Cloudinary)
- Verify file size limits (max 25MB)
- Check server permissions for local storage

### Build Errors

- Clear cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version (18+ required)

## Security Notes

- Always use strong JWT secrets in production
- Never commit `.env` file
- Use HTTPS in production
- Keep dependencies updated
- Enable rate limiting on API routes

## Support

For issues or questions, refer to the main README.md or contact support.
