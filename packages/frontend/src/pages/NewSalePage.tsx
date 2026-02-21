import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function NewSalePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    description: "",
    serviceCode: "1.01",
    buyerName: "",
    buyerDocument: "",
    buyerEmail: "",
  });

  const formatCPFCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2");
    }
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})/, "$1-$2");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const idempotencyKey = crypto.randomUUID();
      await api.post("/sales", {
        amount: parseFloat(form.amount),
        description: form.description,
        serviceCode: form.serviceCode,
        buyer: {
          name: form.buyerName,
          document: form.buyerDocument.replace(/\D/g, ""),
          email: form.buyerEmail || undefined,
        },
        idempotencyKey,
      });

      toast.success("Nota fiscal enviada para processamento!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erro ao emitir nota fiscal");
    } finally {
      setLoading(false);
    }
  };

  const serviceCodes = [
    { value: "1.01", label: "1.01 - Análise e desenvolvimento de sistemas" },
    { value: "1.02", label: "1.02 - Programação" },
    { value: "1.03", label: "1.03 - Processamento de dados" },
    { value: "1.04", label: "1.04 - Elaboração de programas" },
    { value: "1.05", label: "1.05 - Licenciamento de software" },
    { value: "7.02", label: "7.02 - Engenharia consultiva" },
    { value: "17.01", label: "17.01 - Assessoria ou consultoria" },
  ];

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold mb-6">Nova Venda</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Valor */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="input-dark font-mono"
            placeholder="1500.00"
            required
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">
            Descrição do Serviço
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-dark min-h-[80px] resize-y"
            placeholder="Serviço de consultoria em TI"
            required
          />
        </div>

        {/* Código do Serviço */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">
            Código do Serviço
          </label>
          <select
            value={form.serviceCode}
            onChange={(e) => setForm({ ...form, serviceCode: e.target.value })}
            className="input-dark"
          >
            {serviceCodes.map((sc) => (
              <option key={sc.value} value={sc.value}>
                {sc.label}
              </option>
            ))}
          </select>
        </div>

        <hr className="border-dark-border" />

        <h3 className="text-sm font-semibold text-slate-300">Dados do Tomador</h3>

        {/* Nome */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Nome</label>
          <input
            type="text"
            value={form.buyerName}
            onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
            className="input-dark"
            placeholder="João Silva"
            required
          />
        </div>

        {/* CPF/CNPJ */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">CPF/CNPJ</label>
          <input
            type="text"
            value={form.buyerDocument}
            onChange={(e) =>
              setForm({ ...form, buyerDocument: formatCPFCNPJ(e.target.value) })
            }
            className="input-dark font-mono"
            placeholder="000.000.000-00"
            maxLength={18}
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">
            Email <span className="text-slate-600">(opcional)</span>
          </label>
          <input
            type="email"
            value={form.buyerEmail}
            onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })}
            className="input-dark"
            placeholder="joao@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-green w-full flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {loading ? "Emitindo..." : "Emitir Nota Fiscal"}
        </button>
      </form>
    </div>
  );
}
