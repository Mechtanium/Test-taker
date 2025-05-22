import request from 'supertest';

// The baseURL should point to your running Next.js development server
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:9002';

// Mock the global fetch function
global.fetch = jest.fn();

describe('GET /api/test-proxy', () => {
  beforeEach(() => {
    // Reset the mock before each test
    (fetch as jest.Mock).mockClear();
  });

  it('should return 400 if test ID (query parameter "test") is missing', async () => {
    const response = await request(baseURL).get('/api/test-proxy');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Test ID is required');
  });

  it('should proxy the request and return data on successful fetch from external API', async () => {
    const mockTestData = { questions: [{ id: '1', text: 'Test Question' }], test_info: {title: 'Test Title'} };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockTestData,
    });

    const response = await request(baseURL).get('/api/test-proxy?test=some-test-id');
    
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://sapiensng.wixsite.com/annah-ai/_functions-dev/test?test=some-test-id',
      expect.any(Object) // You can be more specific with headers if needed
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockTestData);
  });

  it('should return the external API error status and message if fetch fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => "External Service Unavailable",
    });

    const response = await request(baseURL).get('/api/test-proxy?test=another-id');
    
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(503);
    expect(response.body.error).toContain('Failed to fetch data from external source. Status: 503');
  });

  it('should return 500 if fetch itself throws an error (network error)', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

    const response = await request(baseURL).get('/api/test-proxy?test=network-fail-id');
    
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(500);
    expect(response.body.error).toContain('Internal server error in proxy.');
    expect(response.body.message).toBe('Network failure');
  });
});
