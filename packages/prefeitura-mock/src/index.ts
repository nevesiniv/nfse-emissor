import express from "express";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = 3002;

app.use(express.json({ limit: "5mb" }));
app.use(express.text({ type: "application/xml", limit: "5mb" }));

app.post("/nfse", (req, res) => {
  const xml = typeof req.body === "string" ? req.body : req.body?.xml;

  console.log(`[Prefeitura Mock] Requisição recebida - ${new Date().toISOString()}`);

  if (!xml) {
    res.status(400).json({
      success: false,
      protocol: null,
      message: "XML é obrigatório",
    });
    return;
  }

  // Aguardar 2 segundos simulando processamento
  setTimeout(() => {
    const random = Math.random();

    if (random < 0.7) {
      // 70% sucesso
      const protocol = `PROT-${uuidv4()}`;
      console.log(`[Prefeitura Mock] Sucesso - Protocolo: ${protocol}`);
      res.json({
        success: true,
        protocol,
        message: "NFS-e emitida com sucesso",
      });
    } else {
      // 30% erro
      console.log(`[Prefeitura Mock] Erro simulado`);
      res.json({
        success: false,
        protocol: null,
        message: "Erro no processamento da NFS-e: timeout na validação",
      });
    }
  }, 2000);
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "prefeitura-mock" });
});

app.listen(PORT, () => {
  console.log(`[Prefeitura Mock] Rodando na porta ${PORT}`);
});
