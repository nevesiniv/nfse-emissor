import { Worker } from "bullmq";
import { processNfseEmission, NfseJobData } from "./processors/nfse.processor";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const hostPort = redisUrl.replace("redis://", "").split(":");

const connection = {
  host: hostPort[0] || "localhost",
  port: Number(hostPort[1]) || 6379,
  maxRetriesPerRequest: null,
};

const worker = new Worker<NfseJobData>(
  "nfse-emission",
  async (job) => {
    await processNfseEmission(job);
  },
  {
    connection,
    concurrency: 3,
    settings: {
      backoffStrategy: (attemptsMade: number) => {
        // 1s, 4s, 16s
        return 1000 * Math.pow(4, attemptsMade - 1);
      },
    },
  }
);

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} concluido para sale ${job.data.saleId}`);
});

worker.on("failed", (job, err) => {
  console.error(
    `[Worker] Job ${job?.id} falhou (tentativa ${job?.attemptsMade}): ${err.message}`
  );
});

worker.on("error", (err) => {
  console.error("[Worker] Erro:", err);
});

console.log("[Worker] NFS-e emission worker iniciado");

async function shutdown() {
  console.log("[Worker] Encerrando...");
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
