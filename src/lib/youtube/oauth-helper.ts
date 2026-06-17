import { NextRequest } from 'next/server';

/**
 * Robustly resolve the public request origin, taking proxies and environment configuration into account.
 */
export function getRequestOrigin(req: NextRequest): string {
  // 1. Check x-forwarded-host (sent by reverse proxies)
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  
  if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // 2. Check direct host header
  const host = req.headers.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
  }

  // 3. Fallback to NEXT_PUBLIC_APP_URL in production when proxy headers are not set/forwarded properly
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    // If the request itself was made to a localhost domain by the user (e.g., local development),
    // and we're not running in production mode, respect localhost for local testing.
    const isLocalDev = process.env.NODE_ENV !== 'production' && 
      (host?.includes('localhost') || host?.includes('127.0.0.1') || forwardedHost?.includes('localhost'));
    
    if (!isLocalDev) {
      return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    }
  }

  // 4. Fallback for local development
  const proto = (host?.includes('localhost') || host?.includes('127.0.0.1')) ? 'http' : (req.headers.get('x-forwarded-proto') || 'https');
  const activeHost = host || req.nextUrl.host || 'localhost:3000';
  return `${proto}://${activeHost}`;
}
