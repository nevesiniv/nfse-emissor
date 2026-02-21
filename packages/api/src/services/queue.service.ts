import { Queue } from "bullmq";

export const nfseQueue = new Queue("nfse-emission", {
  connection: {
    host: process.env.REDIS_URL?.replace("redis://", "").split(":")[0] || "localhost",
    port: Number(process.env.REDIS_URL?.split(":").pop()) || 6379,
    maxRetriesPerRequest: null,
  },
});

export async function enqueueNfseEmission(saleId: string): Promise<string> {
  const job = await nfseQueue.add(
    "emit",
    { saleId },
    {
      attempts: 3,
      backoff: { type: "custom" },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    }
  );
  return job.id!;
}
