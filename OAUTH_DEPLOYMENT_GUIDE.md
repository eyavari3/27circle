# OAuth Production Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying Google OAuth authentication in a production-ready manner for the 27 Circle application.

## Environment Configuration

### Development
```bash
# .env.local (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://szttdwmpwqvabtwbhzal.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# Development automatically uses window.location.origin for OAuth
```

### Production
```bash
# .env.production or environment variables in deployment platform
NEXT_PUBLIC_SUPABASE_URL=https://szttdwmpwqvabtwbhzal.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # REQUIRED for production
```

## Google Cloud Console Configuration

### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project or create a new one
3. Navigate to: **APIs & Services** → **Credentials**

### Step 2: Configure OAuth 2.0 Client
1. Find your OAuth 2.0 Client ID (or create new)
2. Click on the client to edit settings

### Step 3: Add Authorized Redirect URIs
Add the following URIs to **Authorized redirect URIs**:

#### Development URIs:
```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
http://localhost:3002/auth/callback
```

#### Production URIs:
```
https://yourdomain.com/auth/callback
https://www.yourdomain.com/auth/callback
```

#### Staging/Preview URIs (if using Vercel):
```
https://your-app-git-main-yourteam.vercel.app/auth/callback
https://your-app-yourteam.vercel.app/auth/callback
```

### Step 4: Add Authorized JavaScript Origins
Add these to **Authorized JavaScript origins**:

#### Development:
```
http://localhost:3000
http://localhost:3001
http://localhost:3002
```

#### Production:
```
https://yourdomain.com
https://www.yourdomain.com
```

## Deployment Platform Configuration

### Vercel
```bash
# Environment Variables in Vercel Dashboard:
NEXT_PUBLIC_SUPABASE_URL=https://szttdwmpwqvabtwbhzal.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Netlify
```bash
# Environment Variables in Netlify Dashboard:
NEXT_PUBLIC_SUPABASE_URL=https://szttdwmpwqvabtwbhzal.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Custom Server
```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://szttdwmpwqvabtwbhzal.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NODE_ENV=production
```

## Testing Checklist

### Pre-Deployment Testing
- [ ] Development OAuth works on localhost:3000
- [ ] Development OAuth works on localhost:3001
- [ ] Error handling displays appropriate messages
- [ ] Onboarding flow preserves state through OAuth
- [ ] Logout flow works properly
- [ ] Both phone and Google auth work independently

### Post-Deployment Testing
- [ ] Production OAuth works on main domain
- [ ] Production OAuth works on www subdomain
- [ ] HTTPS enforcement works correctly
- [ ] Error logging is functional
- [ ] Preview deployments work (if applicable)
- [ ] OAuth callback handles all edge cases

## Security Considerations

### Environment Variables
- ✅ `NEXT_PUBLIC_*` variables are safe for client exposure
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` must remain server-side only
- ✅ No secrets in client-side code

### OAuth Security
- ✅ HTTPS required in production
- ✅ Redirect URI validation prevents attacks
- ✅ State parameter prevents CSRF attacks (handled by Supabase)
- ✅ Scopes limited to necessary permissions

### Error Handling
- ✅ Detailed error logging for debugging
- ✅ User-friendly error messages
- ✅ No sensitive information exposed to users

## Troubleshooting

### Common Issues

#### "redirect_uri_mismatch" Error
**Cause:** Google Cloud Console doesn't have the correct redirect URI
**Solution:** Add the exact URI being used to Google Cloud Console

#### "Invalid OAuth redirect URI" Error
**Cause:** App configuration issue or missing NEXT_PUBLIC_SITE_URL
**Solution:** Set proper environment variables

#### OAuth Works in Development but Not Production
**Cause:** Missing NEXT_PUBLIC_SITE_URL or incorrect domain configuration
**Solution:** Verify environment variables and Google Cloud Console settings

### Debug Commands
```bash
# Check OAuth configuration in browser console
console.log(window.location.origin); // Should match Google Cloud Console

# Check environment variables
npm run build && npm start  # Test production build locally
```

## Monitoring and Maintenance

### Logging
- OAuth attempts are logged with detailed information
- Error responses include error codes for debugging
- Console logs help track authentication flow

### Regular Maintenance
- Review OAuth logs monthly
- Update redirect URIs when domains change
- Test OAuth flow after any authentication changes
- Monitor Google Cloud Console for usage patterns

## Contact and Support
- Development issues: Check browser console and server logs
- Production issues: Review deployment platform logs
- Google OAuth issues: Check Google Cloud Console error messages

---
**Last Updated:** $(date)
**Version:** 1.0.0