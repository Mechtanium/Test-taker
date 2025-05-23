
import { type NextRequest, NextResponse } from 'next/server';
import { DEV_MODE } from '@/lib/utils';
const EXTERNAL_COUNT_API_ENDPOINT = `https://sapiensng.wixsite.com/annah-ai/_functions${DEV_MODE ? "-dev" : ""}/count_assessments`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const testId = searchParams.get('test');
  const ownerId = searchParams.get('_owner');

  if (!testId || !ownerId) {
    return NextResponse.json({ error: 'Test ID and Owner ID are required' }, { status: 400 });
  }

  const externalApiUrl = `${EXTERNAL_COUNT_API_ENDPOINT}?test=${testId}&_owner=${ownerId}`;

  try {
    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Error fetching assessment count from external API: ${response.status}`, errorData);
      return NextResponse.json({ error: `Failed to fetch assessment count. Status: ${response.status}`, details: errorData }, { status: response.status });
    }

    const data = await response.json();
    // The problem description states the external API returns { count: number }
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error in assessment count proxy request:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: 'Internal server error in assessment count proxy.', message: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error in assessment count proxy.' }, { status: 500 });
  }
}
