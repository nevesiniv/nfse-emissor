import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { createSaleSchema } from "../types";
import { enqueueNfseEmission } from "../services/queue.service";

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// POST /sales
router.post("/", async (req: Request, res: Response) => {
  const parsed = createSaleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
    return;
  }

  const { amount, description, serviceCode, buyer, idempotencyKey } = parsed.data;

  // Verificar certificado ativo
  const activeCert = await prisma.certificate.findFirst({
    where: { userId: req.user!.userId, active: true },
  });
  if (!activeCert) {
    res.status(400).json({ error: "Nenhum certificado ativo encontrado. Faça upload de um certificado primeiro." });
    return;
  }

  // Checar idempotencyKey
  if (idempotencyKey) {
    const existing = await prisma.sale.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      res.status(200).json(existing);
      return;
    }
  }

  const sale = await prisma.sale.create({
    data: {
      userId: req.user!.userId,
      amount,
      description,
      serviceCode,
      buyerName: buyer.name,
      buyerDocument: buyer.document,
      buyerEmail: buyer.email,
      status: "PROCESSING",
      idempotencyKey: idempotencyKey || undefined,
    },
  });

  await enqueueNfseEmission(sale.id);

  res.status(202).json({ saleId: sale.id, status: "PROCESSING" });
});

// GET /sales
router.get("/", async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.sale.count({ where: { userId: req.user!.userId } }),
  ]);

  res.json({ data: sales, total, page, limit });
});

// GET /sales/:id
router.get("/:id", async (req: Request, res: Response) => {
  const saleId = req.params.id as string;
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, userId: req.user!.userId },
  });

  if (!sale) {
    res.status(404).json({ error: "Venda não encontrada" });
    return;
  }

  res.json(sale);
});

export default router;
