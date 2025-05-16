
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const testId = searchParams.get('test');

  if (!testId) {
    return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
  }

  const externalApiUrl = `https://sapiensng.wixsite.com/annah-ai/_functions-dev/test?test=${testId}`;

  try {
    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        // You can add any specific headers required by the external API here
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Error fetching from external API: ${response.status}`, errorData);
      return NextResponse.json({ error: `Failed to fetch data from external source. Status: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error in proxy request:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: 'Internal server error in proxy.', message: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error in proxy.' }, { status: 500 });
  }
}
