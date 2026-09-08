# Dittopdf API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via JWT token. Include the token in either:
- Cookie: `token=<your_token>`
- Header: `Authorization: Bearer <your_token>`

## Endpoints

### Authentication

#### POST `/api/auth/register`

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Account created",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clxxx...",
    "email": "user@example.com",
    "planType": "Free"
  }
}
```

**Error Responses:**
- `400` - Email and password required
- `409` - Email already registered
- `429` - Too many requests (rate limited)

---

#### POST `/api/auth/login`

Authenticate an existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clxxx...",
    "email": "user@example.com",
    "planType": "Free"
  }
}
```

**Error Responses:**
- `400` - Email and password required
- `401` - Invalid credentials
- `429` - Too many requests

---

#### POST `/api/auth/logout`

Logout the current user (clears token cookie).

**Response (200 OK):**
```json
{
  "message": "Logged out"
}
```

---

#### GET `/api/auth/me`

Get the currently authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "clxxx...",
    "email": "user@example.com",
    "planType": "Free"
  }
}
```

**Error Responses:**
- `401` - Unauthorized (invalid or missing token)

---

### Tools

#### POST `/api/tools/[tool]`

Process a PDF with the specified tool.

**Available Tools:**
- `merge` - Merge multiple PDFs
- `split` - Split PDF by page range
- `compress` - Compress PDF
- `rotate` - Rotate PDF pages
- `pdf-to-office` - Convert to Word/Excel/PowerPoint
- `pdf-to-images` - Export as images
- `images-to-pdf` - Convert images to PDF
- `pdf-to-text` - Extract text
- `protect` - Add password protection
- `unlock` - Remove password
- `watermark-text` - Add text watermark
- `watermark-image` - Add image watermark
- `annotate` - Add annotations
- `extract-pages` - Extract specific pages
- `extract-images` - Extract embedded images
- `metadata` - Edit metadata

**Request (multipart/form-data):**
```
files: [File, File, ...]      (required)
instructions: string           (optional)
```

**Instructions Examples:**
- Rotate: `90`, `180`, or `270` degrees
- Split/Extract: `page=1-5` or `page=3`
- Watermark text: `text=CONFIDENTIAL`
- Metadata: `title=My PDF; author=John Doe`

**Response (200 OK):**
```json
{
  "message": "Processing complete",
  "downloadUrl": "/downloads/12345-merged.pdf",
  "filename": "merged.pdf"
}
```

**Error Responses:**
- `400` - No files uploaded / Invalid file type / File too large
- `403` - Daily limit reached
- `404` - Unknown tool
- `429` - Too many requests
- `500` - Processing error

**Rate Limit:** 20 requests per minute per IP
**File Limit:** 25MB max per file
**Supported Types:** PDF, PNG, JPG

---

### Files

#### POST `/api/files/upload`

Upload a file for processing.

**Request (multipart/form-data):**
```
file: File (required)
```

**Response (200 OK):**
```json
{
  "message": "Uploaded",
  "url": "/downloads/guest-12345-filename.pdf"
}
```

**Error Responses:**
- `400` - No file uploaded / File too large
- `429` - Too many requests

**Rate Limit:** 15 requests per minute per IP

---

#### GET `/api/files/history`

Get user's file history (authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "files": [
    {
      "id": "clxxx...",
      "originalFilename": "document.pdf",
      "processedFilename": "compressed.pdf",
      "fileSize": 1048576,
      "toolUsed": "compress",
      "status": "processed",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401` - Unauthorized

---

### Dashboard

#### GET `/api/dashboard/overview`

Get dashboard statistics (authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "usageCount": 25,
  "dailyCount": 3,
  "weeklyCount": 12,
  "monthlyCount": 25,
  "files": [
    {
      "id": "clxxx...",
      "originalFilename": "document.pdf",
      "toolUsed": "compress",
      "status": "processed"
    }
  ]
}
```

**Error Responses:**
- `401` - Unauthorized

---

### User

#### GET `/api/user/profile`

Get user profile (authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "clxxx...",
  "email": "user@example.com",
  "planType": "Free",
  "usageCount": 3
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - User not found

---

#### PATCH `/api/user/profile`

Update user profile (authenticated).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "planType": "Pro"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated",
  "user": {
    "id": "clxxx...",
    "email": "user@example.com",
    "planType": "Pro"
  }
}
```

**Error Responses:**
- `401` - Unauthorized

---

## Rate Limiting

All API endpoints are rate limited by IP address:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth endpoints | 5-8 requests | 1 minute |
| Tools | 20 requests | 1 minute |
| Files upload | 15 requests | 1 minute |

When rate limited, the API returns:
```json
{
  "message": "Too many requests. Please try again later."
}
```

Status code: `429 Too Many Requests`

---

## Error Response Format

All error responses follow this format:

```json
{
  "message": "Error description here"
}
```

Common status codes:
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Access denied (e.g., usage limit)
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Usage Limits

### Free Plan
- 5 files per day
- Max 25MB per file
- Files deleted after 1 hour

### Pro Plan
- Unlimited files per day
- Max 25MB per file
- Files deleted after 1 hour

Daily usage resets at midnight UTC.

---

## File Storage

Files are stored based on configuration:

1. **Cloudinary** (if configured) - Returns secure URL
2. **AWS S3** (if configured) - Returns S3 URL
3. **Local** (default) - Returns `/downloads/[key]` route

Downloaded files are automatically deleted after 1 hour.
