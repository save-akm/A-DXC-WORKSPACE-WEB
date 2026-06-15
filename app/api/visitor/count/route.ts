import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth/config';

export async function GET() {
  const res = await fetch(`${authConfig.apiUrl}/visitor/count`, {
    cache: 'no-store',
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
