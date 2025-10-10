# Knowledge Base Services - Authentication Guide

This directory contains services for interacting with the AI Knowledge Base API. The services support two authentication methods: **Cookie-based** (default) and **Token-based**.

## Authentication Methods

### 1. Cookie-based Authentication (Default)

By default, the application uses cookie-based authentication. This means the authentication happens through browser cookies sent with each request via the `withCredentials` option.

**No configuration needed** - this is the default behavior.

### 2. Token-based Authentication

To use API token authentication instead of cookies, you need to configure two environment variables in your `.env` file:

```env
# Enable token authentication
VITE_USE_API_TOKEN=true

# Your API token
VITE_API_TOKEN="your-api-token-here"
```

## Configuration

### Step 1: Update `.env` file

Edit your `.env` file and add/uncomment these lines:

```env
VITE_USE_API_TOKEN=true
VITE_API_TOKEN="your-actual-token"
```

### Step 2: Restart Development Server

After changing environment variables, restart your development server:

```bash
npm run dev
```

## How It Works

The authentication helper (`auth-helper.js`) automatically detects which authentication method to use based on your environment configuration:

- If `VITE_USE_API_TOKEN=true` and `VITE_API_TOKEN` is set → Uses token authentication
- Otherwise → Uses cookie-based authentication (default)

All Knowledge Base services automatically use the correct authentication method:

- `createKnowledgeBaseService`
- `listKnowledgeBaseService`
- `loadKnowledgeBaseService`
- `editKnowledgeBaseService`
- `deleteKnowledgeBaseService`
- `createDocumentService`
- `listDocumentsService`
- `deleteDocumentService`

## Example Usage

The services work the same way regardless of authentication method:

```javascript
import { listKnowledgeBaseService } from '@/services/knowledge-base-services'

// This will use either cookie or token auth based on your .env configuration
const knowledgeBases = await listKnowledgeBaseService()
```

## Debugging

All services include console logging to show which authentication method is being used:

- `🔑 Using Token Authentication` - Token auth is active
- `🍪 Using Cookie Authentication (withCredentials)` - Cookie auth is active

Check your browser console to verify which authentication method is being used.

## Security Notes

⚠️ **Important**: Never commit your actual API token to version control!

- Keep your `.env` file in `.gitignore`
- Use different tokens for development and production
- Rotate tokens regularly for security
