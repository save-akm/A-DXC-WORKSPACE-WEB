import { NextRequest, NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth/config';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${authConfig.apiUrl}/visitor/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      referrer: body.referrer,
      userAgent: req.headers.get('user-agent') ?? undefined,
    }),
  });

  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
