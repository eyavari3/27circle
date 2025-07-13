#!/usr/bin/env node

/**
 * OAuth Configuration Helper
 * Generates current OAuth configuration for debugging and deployment
 */

const { getOAuthDocumentation } = require('../src/lib/auth/oauth-config.ts');

async function main() {
  try {
    console.log('🔐 OAuth Configuration Report');
    console.log('==============================\n');
    
    // This would need to be adapted for Node.js environment
    // For now, provide static configuration based on environment
    
    const isDev = process.env.NODE_ENV === 'development';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    
    console.log('Environment:', isDev ? 'Development' : 'Production');
    console.log('Site URL:', siteUrl || 'Auto-detected from window.location.origin');
    console.log('');
    
    console.log('Required Google Cloud Console Settings:');
    console.log('=====================================');
    
    console.log('\nAuthorized Redirect URIs:');
    const redirectURIs = [
      'http://localhost:3000/auth/callback',
      'http://localhost:3001/auth/callback',
      'http://localhost:3002/auth/callback',
    ];
    
    if (siteUrl) {
      redirectURIs.push(`${siteUrl}/auth/callback`);
      if (!siteUrl.includes('www.')) {
        redirectURIs.push(`${siteUrl.replace('https://', 'https://www.')}/auth/callback`);
      }
    } else {
      redirectURIs.push('https://yourdomain.com/auth/callback');
      redirectURIs.push('https://www.yourdomain.com/auth/callback');
    }
    
    redirectURIs.forEach(uri => console.log(`  - ${uri}`));
    
    console.log('\nAuthorized JavaScript Origins:');
    const origins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ];
    
    if (siteUrl) {
      origins.push(siteUrl);
      if (!siteUrl.includes('www.')) {
        origins.push(siteUrl.replace('https://', 'https://www.'));
      }
    } else {
      origins.push('https://yourdomain.com');
      origins.push('https://www.yourdomain.com');
    }
    
    origins.forEach(origin => console.log(`  - ${origin}`));
    
    console.log('\nEnvironment Variables:');
    console.log('=====================');
    console.log('Required:');
    console.log('  - NEXT_PUBLIC_SUPABASE_URL');
    console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    if (!isDev) {
      console.log('Production-specific:');
      console.log('  - NEXT_PUBLIC_SITE_URL (REQUIRED)');
    }
    
    console.log('\nCurrent Configuration Status:');
    console.log('============================');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
    
    if (!isDev) {
      console.log('Site URL:', siteUrl ? '✅ Set' : '❌ Missing (REQUIRED for production)');
    }
    
    console.log('\nNext Steps:');
    console.log('==========');
    if (isDev) {
      console.log('1. Copy the redirect URIs above to Google Cloud Console');
      console.log('2. Test OAuth login at http://localhost:3001/login');
      console.log('3. Check browser console for OAuth configuration logs');
    } else {
      console.log('1. Set NEXT_PUBLIC_SITE_URL environment variable');
      console.log('2. Add production redirect URIs to Google Cloud Console');
      console.log('3. Deploy and test OAuth flow');
      console.log('4. Monitor logs for any OAuth errors');
    }
    
  } catch (error) {
    console.error('Error generating OAuth configuration:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}