import { Job } from "bullmq";
import axios from "axios";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { buildNfseXml } from "../services/xml.service";
import { decryptBuffer } from "../services/encryption";

const prisma = new PrismaClient();
const PREFEITURA_URL = process.env.PREFEITURA_MOCK_URL || "http://prefeitura-mock:3002";
const WEBHOOK_URL = process.env.WEBHOOK_URL;

export interface NfseJobData {
  saleId: string;
}

export async function processNfseEmission(job: Job<NfseJobData>): Promise<void> {
  const { saleId } = job.data;
  console.log(`[Worker] Processando sale ${saleId}, tentativa ${job.attemptsMade + 1}`);

  // 1. Buscar sale
  const sale = await prisma.sale.findUnique({ where: { id: saleId } });
  if (!sale) {
    console.log(`[Worker] Sale ${saleId} não encontrada, ignorando`);
    return;
  }

  // Idempotência: se já processada, pular
  if (sale.status !== "PROCESSING") {
    console.log(`[Worker] Sale ${saleId} já processada (status: ${sale.status}), ignorando`);
    return;
  }

  // 2. Buscar certificado ativo do usuário
  const cert = await prisma.certificate.findFirst({
    where: { userId: sale.userId, active: true },
  });

  if (!cert) {
    await prisma.sale.update({
      where: { id: saleId },
      data: {
        status: "ERROR",
        errorMessage: "Nenhum certificado ativo encontrado",
        processedAt: new Date(),
      },
    });
    return;
  }

  try {
    // 3. Gerar fingerprint do certificado (hash do pfx encriptado)
    const certFingerprint = crypto
      .createHash("sha256")
      .update(decryptBuffer(cert.pfxData))
      .digest("hex")
      .substring(0, 16);

    // 4. Montar XML
    const xml = buildNfseXml(
      {
        saleId: sale.id,
        amount: sale.amount.toString(),
        description: sale.description,
        serviceCode: sale.serviceCode,
        buyerName: sale.buyerName,
        buyerDocument: sale.buyerDocument,
        buyerEmail: sale.buyerEmail,
      },
      certFingerprint
    );

    // 5. Enviar para Prefeitura Mock via HTTP
    const response = await axios.post(
      `${PREFEITURA_URL}/nfse`,
      { xml },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    );

    if (response.data.success) {
      // 6. Sucesso: atualizar sale
      await prisma.sale.update({
        where: { id: saleId },
        data: {
          status: "SUCCESS",
          protocol: response.data.protocol,
          xmlContent: xml,
          processedAt: new Date(),
        },
      });

      console.log(`[Worker] Sale ${saleId} emitida com sucesso: ${response.data.protocol}`);

      // 7. Disparar webhook se configurado
      if (WEBHOOK_URL) {
        try {
          await axios.post(
            WEBHOOK_URL,
            {
              event: "nfse.issued",
              saleId: sale.id,
              protocol: response.data.protocol,
              amount: Number(sale.amount),
              issuedAt: new Date().toISOString(),
            },
            { timeout: 10000 }
          );
          await prisma.sale.update({
            where: { id: saleId },
            data: { webhookSentAt: new Date() },
          });
        } catch (webhookErr) {
          console.error(`[Worker] Webhook falhou para sale ${saleId}:`, webhookErr);
        }
      }
    } else {
      // Prefeitura rejeitou
      await prisma.sale.update({
        where: { id: saleId },
        data: {
          status: "ERROR",
          xmlContent: xml,
          errorMessage: response.data.message || "Erro na prefeitura",
          processedAt: new Date(),
        },
      });

      console.log(`[Worker] Sale ${saleId} rejeitada: ${response.data.message}`);
      // Não lançar erro = não faz retry (rejeição é determinística)
    }
  } catch (error: any) {
    // Erro de rede/timeout: marcar ERROR e deixar BullMQ fazer retry
    const errorMessage = error?.message || "Erro desconhecido no processamento";

    await prisma.sale.update({
      where: { id: saleId },
      data: {
        status: "PROCESSING", // Manter PROCESSING para retry
        errorMessage,
      },
    });

    console.error(`[Worker] Erro ao processar sale ${saleId}: ${errorMessage}`);
    throw error; // Re-lança para BullMQ fazer retry
  }
}
