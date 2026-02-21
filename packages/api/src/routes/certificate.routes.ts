import { Router, Request, Response } from "express";
import tls from "node:tls";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { encryptBuffer, encryptString } from "../utils/encryption";

const router = Router();
const prisma = new PrismaClient();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      file.originalname.endsWith(".pfx") ||
      file.originalname.endsWith(".p12")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos .pfx ou .p12 são aceitos"));
    }
  },
});

router.use(authMiddleware);

// POST /certificates/upload
router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "Arquivo .pfx é obrigatório" });
      return;
    }

    const { password } = req.body;
    if (!password) {
      res.status(400).json({ error: "Senha do certificado é obrigatória" });
      return;
    }

    // Validar se a senha abre o arquivo .pfx
    try {
      tls.createSecureContext({ pfx: req.file.buffer, passphrase: password });
    } catch {
      res.status(400).json({ error: "Senha do certificado inválida" });
      return;
    }

    const encryptedPfx = encryptBuffer(req.file.buffer);
    const encryptedPassword = encryptString(password);

    const certificate = await prisma.certificate.create({
      data: {
        userId: req.user!.userId,
        filename: req.file.originalname,
        pfxData: encryptedPfx,
        passwordHash: encryptedPassword,
        active: true,
      },
    });

    res.status(201).json({
      certificateId: certificate.id,
      filename: certificate.filename,
      active: certificate.active,
    });
  }
);

// GET /certificates
router.get("/", async (req: Request, res: Response) => {
  const certificates = await prisma.certificate.findMany({
    where: { userId: req.user!.userId },
    select: {
      id: true,
      filename: true,
      active: true,
      createdAt: true,
    },
  });
  res.json(certificates);
});

// DELETE /certificates/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const certId = req.params.id as string;
  const cert = await prisma.certificate.findFirst({
    where: { id: certId, userId: req.user!.userId },
  });

  if (!cert) {
    res.status(404).json({ error: "Certificado não encontrado" });
    return;
  }

  await prisma.certificate.update({
    where: { id: certId },
    data: { active: false },
  });

  res.status(204).end();
});

export default router;
