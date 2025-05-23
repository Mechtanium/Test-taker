
import { type NextRequest, NextResponse } from 'next/server';
import { DEV_MODE } from '@/lib/utils';

const EXTERNAL_SUBMISSION_API_ENDPOINT = `https://sapiensng.wixsite.com/annah-ai/_functions${DEV_MODE ? "-dev" : ""}/save_assessment`;

export async function POST(request: NextRequest) {
  try {
    const submissionData = await request.json();

    const response = await fetch(EXTERNAL_SUBMISSION_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any other headers required by the external API if necessary
      },
      body: JSON.stringify(submissionData),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error submitting to external API: ${response.status}`, errorBody);
      return NextResponse.json({ error: `Failed to submit data to external source. Status: ${response.status}`, details: errorBody }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error in submission proxy request:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: 'Internal server error in submission proxy.', message: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error in submission proxy.' }, { status: 500 });
  }
}
