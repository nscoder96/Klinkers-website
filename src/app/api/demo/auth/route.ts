import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

// Simple token verification using HMAC
function createToken(password: string, secret: string): string {
  const timestamp = Date.now();
  const data = `demo:${password}:${timestamp}`;
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
      return false;
    }

    // Verify signature
    const expectedSignature = crypto.createHmac('sha256', secret).update(`demo:${password}:${timestamp}`).digest('hex');
    return signature === expectedSignature;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    // Use same password as admin
    const adminPassword = process.env.ADMIN_PASSWORD;
    const secret = process.env.ADMIN_SECRET || adminPassword || 'fallback-secret-key';

    if (!adminPassword) {
      return NextResponse.json({ error: 'Server configuratie fout' }, { status: 500 });
    }

    if (password === adminPassword) {
      const token = createToken(adminPassword, secret);

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set('demo_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/'
      });

      return NextResponse.json({ token, success: true });
    }

    return NextResponse.json({ error: 'Onjuist wachtwoord' }, { status: 401 });
  } catch (error) {
    console.error('Demo auth error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SECRET || adminPassword || 'fallback-secret-key';

  if (!adminPassword) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const authHeader = request.headers.get('Authorization');
  let token = authHeader?.replace('Bearer ', '');

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('demo_token')?.value;
  }

  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  if (verifyToken(token, adminPassword, secret)) {
    return NextResponse.json({ valid: true });
  }

  return NextResponse.json({ valid: false }, { status: 401 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('demo_token');
  return NextResponse.json({ success: true });
}
