// tests/unit/formatTime.test.ts

// This function is a copy of the one in src/app/page.tsx for isolated unit testing.
// Ideally, this would be imported from a shared utils file.
const formatTime = (ms: number): string => {
  if (ms < 0) return "∞"; // For questions with no time limit
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

describe('formatTime utility', () => {
  it('should format milliseconds to MM:SS correctly', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(1000)).toBe('00:01');
    expect(formatTime(59000)).toBe('00:59');
    expect(formatTime(60000)).toBe('01:00');
    expect(formatTime(61000)).toBe('01:01');
    expect(formatTime(3599000)).toBe('59:59'); // 59 minutes, 59 seconds
  });

  it('should handle multiples of 60 seconds correctly', () => {
    expect(formatTime(120000)).toBe('02:00'); // 2 minutes
    expect(formatTime(3600000)).toBe('60:00'); // 60 minutes
  });

  it('should return "∞" for negative millisecond values', () => {
    expect(formatTime(-1)).toBe('∞');
    expect(formatTime(-1000)).toBe('∞');
  });

  it('should pad single digit minutes and seconds with a leading zero', () => {
    expect(formatTime(5000)).toBe('00:05'); // 5 seconds
    expect(formatTime(300000)).toBe('05:00'); // 5 minutes
    expect(formatTime(305000)).toBe('05:05'); // 5 minutes 5 seconds
  });

  it('should handle large millisecond values correctly', () => {
    expect(formatTime(3600000 * 2)).toBe('120:00'); // 120 minutes
  });
});
