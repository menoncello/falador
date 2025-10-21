/**
 * Falador Job Worker
 * Background job processing with BullMQ
 */

export const version = '0.0.1';

export interface Job {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

/**
 * Get supported job types
 * @returns Array of supported job types
 */
export function getSupportedJobTypes(): string[] {
  return ['audio-processing', 'text-generation'];
}

/**
 * Validate job structure
 * @param job - The job to validate
 * @returns True if job is valid
 */
export function validateJob(job: Job): boolean {
  const hasValidId = job.id && typeof job.id === 'string' && job.id.length > 0;
  const hasValidType =
    job.type && typeof job.type === 'string' && job.type.length > 0;
  const hasValidData = job.data && typeof job.data === 'object';

  return hasValidId && hasValidType && hasValidData;
}

/**
 * Check if job type is supported
 * @param jobType - The job type to check
 * @returns True if job type is supported
 */
export function isSupportedJobType(jobType: string): boolean {
  const supportedTypes = getSupportedJobTypes();
  return supportedTypes.includes(jobType);
}

/**
 * Process a background job
 * @param job - The job to process
 */
export async function processJob(job: Job): Promise<void> {
  const jobId = job.id;
  const jobType = job.type;

  if (!jobId || !jobType) {
    throw new Error('Job must have valid id and type');
  }

  console.log(`Processing job ${jobId} of type ${jobType}`);

  // Job processing logic will be implemented here
  // This is a placeholder implementation that validates job structure
  // In production, this would switch on jobType to implement specific job handlers
  switch (jobType) {
    case 'audio-processing':
      // Future: Implement audio file processing logic
      console.log(`Audio processing job ${jobId} would be handled here`);
      break;
    case 'text-generation':
      // Future: Implement text generation logic
      console.log(`Text generation job ${jobId} would be handled here`);
      break;
    default:
      console.log(`Unknown job type ${jobType} for job ${jobId}`);
      break;
  }
}
