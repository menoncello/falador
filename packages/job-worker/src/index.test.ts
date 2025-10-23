/**
 * Job Worker Module Tests
 */

import { Job, JobProcessor } from './index';

describe('Job Worker', () => {
  it('should create a job processor', () => {
    const processor = new JobProcessor();
    expect(processor).toBeInstanceOf(JobProcessor);
  });

  it('should process jobs', async () => {
    const processor = new JobProcessor();
    const job: Job = {
      id: 'test-job',
      type: 'test',
      payload: { data: 'test' },
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock console.log to verify it's called with correct parameters
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = processor.processJob(job);
    await expect(result).resolves.toBeUndefined();

    // Verify that console.log was called with the correct message
    expect(consoleSpy).toHaveBeenCalledWith('Processing job test-job of type test');

    consoleSpy.mockRestore();
  });

  it('should log job details correctly', async () => {
    const processor = new JobProcessor();
    const job: Job = {
      id: 'special-job-123',
      type: 'email-sender',
      payload: { recipient: 'test@example.com' },
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await processor.processJob(job);

    // Verify the exact log message format
    expect(consoleSpy).toHaveBeenCalledWith('Processing job special-job-123 of type email-sender');

    consoleSpy.mockRestore();
  });
});