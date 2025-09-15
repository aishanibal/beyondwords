import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('[TEST API] GET /api/test called');
  return NextResponse.json({ message: 'Test API route is working', timestamp: new Date().toISOString() });
}
