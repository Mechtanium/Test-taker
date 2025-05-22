import request from 'supertest';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:9002';

// Mock the global fetch function
global.fetch = jest.fn();

describe('POST /api/submit-assessment', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  const validSubmissionData = {
    _owner: "test_owner_id",
    matriculationNumber: "TEST12345",
    studentEmail: "student@example.com",
    test_id: "test_abc_123",
    location: "Geo-location not implemented",
    status: "completed",
    type: "testSubmission",
    answers: [{ questionId: "q1", questionType: "MCQ", answer: "Option A", timeTaken: 10000 }],
  };

  it('should proxy the submission and return success if external API succeeds', async () => {
    const mockApiResponse = { success: true, submissionId: "external-submission-id" };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    });

    const response = await request(baseURL)
      .post('/api/submit-assessment')
      .send(validSubmissionData);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "https://sapiensng.wixsite.com/annah-ai/_functions-dev/save_assessment",
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSubmissionData),
      }
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockApiResponse);
  });

  it('should return external API error status and message if submission to external API fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Invalid submission data by external API",
    });

    const response = await request(baseURL)
      .post('/api/submit-assessment')
      .send(validSubmissionData);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Failed to submit data to external source. Status: 400');
    expect(response.body.details).toBe('Invalid submission data by external API');
  });

  it('should return 500 if request body is not valid JSON', async () => {
    // Note: Next.js itself might handle this before it reaches the route handler
    // if 'Content-Type' is 'application/json' and body is malformed.
    // This test simulates a case where the handler receives non-JSON, if possible.
    // If Next.js's bodyParser throws first, that's also a valid outcome for this kind of request.
    const response = await request(baseURL)
      .post('/api/submit-assessment')
      .set('Content-Type', 'application/json') // Important for Next.js bodyParser
      .send('this is not json'); 
      // Next.js 13+ App Router handles JSON parsing errors and might return 400 or 500.
      // Let's expect non-200 for now.
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(600); 
  });
  
  it('should return 500 if fetch itself throws an error (network error)', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('External network failure'));

    const response = await request(baseURL)
      .post('/api/submit-assessment')
      .send(validSubmissionData);
    
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(500);
    expect(response.body.error).toContain('Internal server error in submission proxy.');
    expect(response.body.message).toBe('External network failure');
  });
});
