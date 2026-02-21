import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from "recharts";
import api from "../services/api";
import { Sale, SalesResponse } from "../types";
import StatusBadge from "../components/StatusBadge";
import { SkeletonCard, SkeletonTableRow } from "../components/Skeleton";

// === Counting animation hook ===
function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(target);

  useEffect(() => {
    const start = prevTarget.current;
    prevTarget.current = target;
    if (start === target) {
      setValue(target);
      return;
    }
    const startTime = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function useCountUpCurrency(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(target);

  useEffect(() => {
    const start = prevTarget.current;
    prevTarget.current = target;
    if (start === target) {
      setValue(target);
      return;
    }
    const startTime = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (target - start) * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export default function DashboardPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  // Filter state
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const fetchSales = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { page, limit };
      if (filterStatus) params.status = filterStatus;
      if (filterSearch) params.search = filterSearch;
      if (filterDateFrom) params.dateFrom = filterDateFrom;
      if (filterDateTo) params.dateTo = filterDateTo;

      const { data } = await api.get<SalesResponse>("/sales", { params });
      setSales(data.data);
      setTotal(data.total);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [page, filterStatus, filterSearch, filterDateFrom, filterDateTo]);

  // Fetch all sales for summary cards (not filtered by pagination)
  const fetchAllSummary = useCallback(async () => {
    try {
      const { data } = await api.get<SalesResponse>("/sales", {
        params: { page: 1, limit: 1000 },
      });
      setAllSales(data.data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchSales();
    fetchAllSummary();
    const interval = setInterval(() => {
      fetchSales();
      fetchAllSummary();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchSales, fetchAllSummary]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterSearch, filterDateFrom, filterDateTo]);

  const totalSales = allSales.length;
  const successSales = allSales.filter((s) => s.status === "SUCCESS").length;
  const errorSales = allSales.filter((s) => s.status === "ERROR").length;
  const processingSales = allSales.filter((s) => s.status === "PROCESSING").length;
  const totalAmount = allSales
    .filter((s) => s.status === "SUCCESS")
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const animTotal = useCountUp(totalSales);
  const animSuccess = useCountUp(successSales);
  const animError = useCountUp(errorSales);
  const animProcessing = useCountUp(processingSales);
  const animAmount = useCountUpCurrency(totalAmount);

  const formatBRL = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const totalPages = Math.ceil(total / limit);

  // Chart data: status distribution
  const chartStatusData = [
    { name: "Sucesso", value: successSales, fill: "#10B981" },
    { name: "Erro", value: errorSales, fill: "#EF4444" },
    { name: "Processando", value: processingSales, fill: "#F59E0B" },
  ];

  // Chart data: daily values (last 7 days)
  const dailyData = (() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      days[key] = 0;
    }
    allSales
      .filter((s) => s.status === "SUCCESS")
      .forEach((s) => {
        const key = new Date(s.createdAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });
        if (key in days) days[key] += Number(s.amount);
      });
    return Object.entries(days).map(([date, valor]) => ({ date, valor }));
  })();

  // CSV export
  const exportCSV = () => {
    const rows = sales.map((s) => ({
      Data: formatDate(s.createdAt),
      Descricao: s.description,
      Tomador: s.buyerName,
      Documento: s.buyerDocument,
      Valor: Number(s.amount).toFixed(2),
      Status: s.status,
      Protocolo: s.protocol || "",
    }));
    const header = Object.keys(rows[0] || {}).join(",");
    const csv = [
      header,
      ...rows.map((r) =>
        Object.values(r)
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notas-fiscais-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilterStatus("");
    setFilterSearch("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasFilters = filterStatus || filterSearch || filterDateFrom || filterDateTo;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`animate-fade-in-up stagger-${i}`} style={{ opacity: 0 }}>
                <SkeletonCard />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="card animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Notas</p>
              <p className="text-2xl font-bold font-mono mt-1">{animTotal}</p>
            </div>
            <div className="card animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Sucesso</p>
              <p className="text-2xl font-bold font-mono mt-1 text-accent-green">{animSuccess}</p>
            </div>
            <div className="card animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Erro</p>
              <p className="text-2xl font-bold font-mono mt-1 text-accent-red">{animError}</p>
            </div>
            <div className="card animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Processando</p>
              <p className="text-2xl font-bold font-mono mt-1 text-accent-amber animate-pulse-glow">
                {animProcessing}
              </p>
            </div>
            <div className="card animate-fade-in-up stagger-5" style={{ opacity: 0 }}>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Valor Total</p>
              <p className="text-2xl font-bold font-mono mt-1 text-accent-green">
                {formatBRL(animAmount)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      {allSales.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up" style={{ opacity: 0, animationDelay: "300ms" }}>
          {/* Status bar chart */}
          <div className="card-static">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Distribuição por Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartStatusData}>
                <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #1E293B",
                    borderRadius: "0.5rem",
                    color: "#F1F5F9",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartStatusData.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Daily values area chart */}
          <div className="card-static">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Valor Diário (7 dias)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #1E293B",
                    borderRadius: "0.5rem",
                    color: "#F1F5F9",
                    fontSize: 12,
                  }}
                  formatter={(value) => [formatBRL(Number(value)), "Valor"]}
                />
                <Area type="monotone" dataKey="valor" stroke="#10B981" fill="url(#gradientGreen)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters & table */}
      <div className="card-static !p-0 overflow-hidden">
        <div className="p-4 border-b border-dark-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Notas Fiscais</h2>
            {sales.length > 0 && (
              <button
                onClick={exportCSV}
                className="text-xs text-accent-blue hover:text-blue-300 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar CSV
              </button>
            )}
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-accent-blue transition-colors"
            >
              <option value="">Todos os status</option>
              <option value="SUCCESS">Sucesso</option>
              <option value="ERROR">Erro</option>
              <option value="PROCESSING">Processando</option>
            </select>

            <input
              type="text"
              placeholder="Buscar nome ou descrição..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="text-xs bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-accent-blue transition-colors w-48"
            />

            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="text-xs bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-accent-blue transition-colors"
            />
            <span className="text-xs text-slate-500">até</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="text-xs bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-accent-blue transition-colors"
            />

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors ml-1"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-dark-border">
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Descrição</th>
                  <th className="text-left px-4 py-3">Tomador</th>
                  <th className="text-right px-4 py-3">Valor</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonTableRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-16 text-center animate-fade-in">
            <div className="inline-block animate-float">
              <svg className="w-16 h-16 mx-auto text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm mt-4 font-medium">
              {hasFilters ? "Nenhum resultado encontrado" : "Nenhuma nota fiscal emitida"}
            </p>
            <p className="text-slate-600 text-xs mt-1.5">
              {hasFilters
                ? "Tente ajustar os filtros para ver mais resultados"
                : "Crie uma nova venda para começar a emitir notas"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-dark-border">
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Descrição</th>
                  <th className="text-left px-4 py-3">Tomador</th>
                  <th className="text-right px-4 py-3">Valor</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, index) => (
                  <tr
                    key={sale.id}
                    className={`border-b border-dark-border/50 hover:bg-dark-bg/50 transition-colors animate-fade-in-up stagger-row-${index + 1}`}
                    style={{ opacity: 0 }}
                  >
                    <td className="px-4 py-3 text-sm font-mono text-slate-400">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 max-w-[200px] truncate">
                      {sale.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {sale.buyerName}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-right text-slate-200">
                      {formatBRL(Number(sale.amount))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={sale.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="text-xs text-accent-blue hover:text-blue-300 transition-colors"
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-dark-border flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Mostrando {(page - 1) * limit + 1}-{Math.min(page * limit, total)} de{" "}
              {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs text-slate-400 border border-dark-border rounded hover:bg-dark-bg disabled:opacity-30 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs text-slate-400 border border-dark-border rounded hover:bg-dark-bg disabled:opacity-30 transition-colors"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSale && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay-in"
          onClick={() => setSelectedSale(null)}
        >
          <div
            className="card-static max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalhes da Nota</h3>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-slate-500 hover:text-slate-300 text-xl transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">ID</span>
                <span className="font-mono text-xs">{selectedSale.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={selectedSale.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor</span>
                <span className="font-mono">{formatBRL(Number(selectedSale.amount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Descrição</span>
                <span className="text-right max-w-[300px]">{selectedSale.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tomador</span>
                <span>{selectedSale.buyerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CPF/CNPJ</span>
                <span className="font-mono">{selectedSale.buyerDocument}</span>
              </div>
              {selectedSale.protocol && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Protocolo</span>
                  <span className="font-mono text-accent-green">{selectedSale.protocol}</span>
                </div>
              )}
              {selectedSale.errorMessage && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Erro</span>
                  <span className="text-accent-red text-right max-w-[300px]">
                    {selectedSale.errorMessage}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Criado em</span>
                <span className="font-mono text-xs">{formatDate(selectedSale.createdAt)}</span>
              </div>
              {selectedSale.processedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Processado em</span>
                  <span className="font-mono text-xs">{formatDate(selectedSale.processedAt)}</span>
                </div>
              )}
            </div>

            {selectedSale.xmlContent && (
              <div className="mt-4">
                <p className="text-sm text-slate-500 mb-2">XML Gerado</p>
                <pre className="bg-dark-bg border border-dark-border rounded-lg p-4 text-xs font-mono text-slate-400 overflow-x-auto max-h-60">
                  {selectedSale.xmlContent}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
