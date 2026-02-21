import { useState, useEffect, useCallback, useRef, DragEvent } from "react";
import api from "../services/api";
import { Certificate } from "../types";
import toast from "react-hot-toast";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [uploading, setUploading] = useState(false);
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCertificates = useCallback(async () => {
    try {
      const { data } = await api.get<Certificate[]>("/certificates");
      setCertificates(data);
    } catch {
      toast.error("Erro ao carregar certificados");
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleUpload = async () => {
    if (!file || !password) {
      toast.error("Selecione um arquivo .pfx e informe a senha");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", password);

      await api.post("/certificates/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Certificado enviado com sucesso!");
      setFile(null);
      setPassword("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchCertificates();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erro ao enviar certificado");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/certificates/${id}`);
      toast.success("Certificado desativado");
      fetchCertificates();
    } catch {
      toast.error("Erro ao desativar certificado");
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (
      droppedFile &&
      (droppedFile.name.endsWith(".pfx") || droppedFile.name.endsWith(".p12"))
    ) {
      setFile(droppedFile);
    } else {
      toast.error("Apenas arquivos .pfx ou .p12 são aceitos");
    }
  };

  const hasActiveCert = certificates.some((c) => c.active);

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold">Certificados Digitais</h2>

      {!hasActiveCert && (
        <div className="bg-accent-amber/10 border border-accent-amber/20 rounded-lg p-4 text-sm text-accent-amber">
          Nenhum certificado ativo. Faça upload de um certificado .pfx para emitir notas fiscais.
        </div>
      )}

      {/* Upload area */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-slate-300">Upload de Certificado</h3>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? "border-accent-blue bg-accent-blue/5"
              : file
              ? "border-accent-green bg-accent-green/5"
              : "border-dark-border hover:border-slate-500"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pfx,.p12"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile(f);
            }}
          />
          {file ? (
            <div>
              <p className="text-accent-green font-mono text-sm">{file.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-slate-400 text-sm">
                Arraste um arquivo .pfx aqui ou clique para selecionar
              </p>
              <p className="text-xs text-slate-600 mt-1">Máximo 10MB</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1.5">
            Senha do Certificado
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-dark"
            placeholder="Senha do arquivo .pfx"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || !file || !password}
          className="btn-primary flex items-center gap-2"
        >
          {uploading && (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {uploading ? "Enviando..." : "Enviar Certificado"}
        </button>
      </div>

      {/* Certificate list */}
      {certificates.length > 0 && (
        <div className="card !p-0 overflow-hidden">
          <div className="p-4 border-b border-dark-border">
            <h3 className="text-sm font-semibold text-slate-300">
              Certificados Enviados
            </h3>
          </div>
          <div className="divide-y divide-dark-border/50">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-dark-bg/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {cert.active ? "🟢" : "🔴"}
                  </span>
                  <div>
                    <p className="text-sm font-mono text-slate-300">
                      {cert.filename}
                    </p>
                    <p className="text-xs text-slate-500">
                      Enviado em{" "}
                      {new Date(cert.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-mono ${
                      cert.active ? "text-accent-green" : "text-slate-500"
                    }`}
                  >
                    {cert.active ? "Ativo" : "Inativo"}
                  </span>
                  {cert.active && (
                    <button
                      onClick={() => handleDelete(cert.id)}
                      className="text-xs text-slate-500 hover:text-accent-red transition-colors"
                    >
                      Desativar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
