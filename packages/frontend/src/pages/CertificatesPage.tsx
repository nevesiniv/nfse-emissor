import { useState, useEffect, useCallback, useRef, DragEvent } from "react";
import api from "../services/api";
import { Certificate } from "../types";
import toast from "react-hot-toast";
import { SkeletonCertRow } from "../components/Skeleton";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
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

      {!loading && !hasActiveCert && (
        <div className="bg-accent-amber/10 border border-accent-amber/20 rounded-lg p-4 flex items-start gap-3 animate-fade-in-up" style={{ opacity: 0 }}>
          <svg className="w-5 h-5 text-accent-amber flex-shrink-0 mt-0.5 animate-pulse-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-accent-amber">Nenhum certificado ativo</p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Faça upload de um certificado .pfx para emitir notas fiscais.
            </p>
          </div>
        </div>
      )}

      {/* Upload area */}
      <div className="card-static space-y-4 animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
        <h3 className="text-sm font-semibold text-slate-300">Upload de Certificado</h3>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
            dragOver
              ? "border-accent-blue bg-accent-blue/10 scale-[1.01]"
              : file
              ? "border-accent-green bg-accent-green/5"
              : "border-dark-border hover:border-slate-500 hover:bg-dark-bg/50"
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
            <div className="animate-scale-in">
              <svg className="w-8 h-8 mx-auto text-accent-green mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-accent-green font-mono text-sm">{file.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div>
              <svg className="w-8 h-8 mx-auto text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
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
      {loading ? (
        <div className="card-static !p-0 overflow-hidden">
          <div className="p-4 border-b border-dark-border">
            <h3 className="text-sm font-semibold text-slate-300">
              Certificados Enviados
            </h3>
          </div>
          <div className="divide-y divide-dark-border/50">
            {[1, 2].map((i) => (
              <SkeletonCertRow key={i} />
            ))}
          </div>
        </div>
      ) : certificates.length > 0 ? (
        <div className="card-static !p-0 overflow-hidden animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
          <div className="p-4 border-b border-dark-border">
            <h3 className="text-sm font-semibold text-slate-300">
              Certificados Enviados
            </h3>
          </div>
          <div className="divide-y divide-dark-border/50">
            {certificates.map((cert, index) => (
              <div
                key={cert.id}
                className={`flex items-center justify-between px-4 py-3 hover:bg-dark-bg/50 transition-colors animate-fade-in-up stagger-row-${index + 1}`}
                style={{ opacity: 0 }}
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
      ) : (
        <div className="card-static text-center py-12 animate-fade-in">
          <div className="inline-block animate-float">
            <svg className="w-12 h-12 mx-auto text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm mt-3 font-medium">Nenhum certificado enviado</p>
          <p className="text-slate-600 text-xs mt-1">
            Faça upload do seu certificado digital .pfx acima
          </p>
        </div>
      )}
    </div>
  );
}
