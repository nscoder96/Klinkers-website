import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

// Simple token verification using HMAC
function createToken(password: string, secret: string): string {
  const timestamp = Date.now();
  const data = `${password}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(`${timestamp}.${signature}`).toString('base64');
}

function verifyToken(token: string, password: string, secret: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [timestampStr, signature] = decoded.split('.');
    const timestamp = parseInt(timestampStr, 10);

    // Token expires after 7 days
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAge) {
      console.log('Token expired');
      return false;
    }

    // Verify signature
    const expectedSignature = crypto.createHmac('sha256', secret).update(`${password}:${timestamp}`).digest('hex');
    const valid = signature === expectedSignature;
    if (!valid) {
      console.log('Token signature mismatch');
    }
    return valid;
  } catch (e) {
    console.log('Token verification error:', e);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD;
    const secret = process.env.ADMIN_SECRET || adminPassword || 'fallback-secret-key';

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD not configured');
      return NextResponse.json({ error: 'Server configuratie fout' }, { status: 500 });
    }

    if (password === adminPassword) {
      const token = createToken(adminPassword, secret);

      // Set cookie as well for backup
      const cookieStore = await cookies();
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      });

      return NextResponse.json({ token, success: true });
    }

    return NextResponse.json({ error: 'Onjuist wachtwoord' }, { status: 401 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// Verify token endpoint
export async function GET(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SECRET || adminPassword || 'fallback-secret-key';

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD not configured in GET');
    return NextResponse.json({ valid: false, error: 'No password configured' }, { status: 401 });
  }

  // Try Authorization header first
  const authHeader = request.headers.get('Authorization');
  let token = authHeader?.replace('Bearer ', '');

  // If no header, try cookie
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('admin_token')?.value;
  }

  if (!token) {
    console.log('No token found in header or cookie');
    return NextResponse.json({ valid: false, error: 'No token' }, { status: 401 });
  }

  if (verifyToken(token, adminPassword, secret)) {
    return NextResponse.json({ valid: true });
  }

  return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 });
}

// Logout endpoint
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  return NextResponse.json({ success: true });
}
