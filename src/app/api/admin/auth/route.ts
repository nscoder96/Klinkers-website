import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Simple token verification using HMAC
function createToken(password: string, secret: string): string {
  const timestamp = Date.now();
  const data = `${password}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  // Token format: timestamp.signature
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
    const expectedSignature = crypto.createHmac('sha256', secret).update(`${password}:${timestamp}`).digest('hex');
    return signature === expectedSignature;
  } catch {
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
      return NextResponse.json({ token });
    }

    return NextResponse.json({ error: 'Onjuist wachtwoord' }, { status: 401 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// Verify token endpoint
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SECRET || adminPassword || 'fallback-secret-key';

  if (!token || !adminPassword) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  if (verifyToken(token, adminPassword, secret)) {
    return NextResponse.json({ valid: true });
  }

  return NextResponse.json({ valid: false }, { status: 401 });
}
