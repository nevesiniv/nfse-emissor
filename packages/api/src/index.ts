import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import certificateRoutes from "./routes/certificate.routes";
import saleRoutes from "./routes/sale.routes";

const app = express();
const PORT = Number(process.env.API_PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use("/certificates", certificateRoutes);
app.use("/sales", saleRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Erro:", err.message);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
);

app.listen(PORT, () => {
  console.log(`[API] Rodando na porta ${PORT}`);
});
