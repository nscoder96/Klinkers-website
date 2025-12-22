import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Generate a secure token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Store valid tokens (in production, use Redis or database)
// For simplicity, we use a module-level variable
const validTokens = new Set<string>();

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD not configured');
      return NextResponse.json({ error: 'Server configuratie fout' }, { status: 500 });
    }

    if (password === adminPassword) {
      const token = generateToken();
      validTokens.add(token);

      // Clean up old tokens (keep max 10)
      if (validTokens.size > 10) {
        const tokensArray = Array.from(validTokens);
        validTokens.delete(tokensArray[0]);
      }

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

  if (!token || !validTokens.has(token)) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({ valid: true });
}
