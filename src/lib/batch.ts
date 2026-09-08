import Queue from 'bull';
import { prisma } from './prisma';

const batchQueue = new Queue('pdf-batch-processing', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export async function addBatchJob(userId: string, jobType: string, payload: any) {
  const job = await prisma.batchJobs.create({
    data: {
      userId,
      jobType,
      payload,
      status: 'pending',
    },
  });

  await batchQueue.add({
    jobId: job.id,
    userId,
    jobType,
    payload,
  });

  return job;
}

batchQueue.process(async (job) => {
  const { jobId, jobType, payload } = job.data;
  
  await prisma.batchJobs.update({
    where: { id: jobId },
    data: { status: 'processing' },
  });

  try {
    // Implement actual processing logic here based on jobType
    // For now, we simulate processing
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await prisma.batchJobs.update({
      where: { id: jobId },
      data: { 
        status: 'completed',
        result: { message: 'Batch processing completed successfully' }
      },
    });
  } catch (error: any) {
    await prisma.batchJobs.update({
      where: { id: jobId },
      data: { 
        status: 'failed',
        result: { error: error.message }
      },
    });
  }
});

export { batchQueue };
