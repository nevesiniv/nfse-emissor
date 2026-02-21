import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { Sale, SalesResponse } from "../types";
import StatusBadge from "../components/StatusBadge";

export default function DashboardPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const limit = 10;

  const fetchSales = useCallback(async () => {
    try {
      const { data } = await api.get<SalesResponse>("/sales", {
        params: { page, limit },
      });
      setSales(data.data);
      setTotal(data.total);
    } catch {
      // silently fail on polling
    }
  }, [page]);

  useEffect(() => {
    fetchSales();
    const interval = setInterval(fetchSales, 5000);
    return () => clearInterval(interval);
  }, [fetchSales]);

  const totalSales = total;
  const successSales = sales.filter((s) => s.status === "SUCCESS").length;
  const errorSales = sales.filter((s) => s.status === "ERROR").length;
  const processingSales = sales.filter((s) => s.status === "PROCESSING").length;
  const totalAmount = sales
    .filter((s) => s.status === "SUCCESS")
    .reduce((sum, s) => sum + Number(s.amount), 0);

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

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total Notas</p>
          <p className="text-2xl font-bold font-mono mt-1">{totalSales}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Sucesso</p>
          <p className="text-2xl font-bold font-mono mt-1 text-accent-green">{successSales}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Erro</p>
          <p className="text-2xl font-bold font-mono mt-1 text-accent-red">{errorSales}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Processando</p>
          <p className="text-2xl font-bold font-mono mt-1 text-accent-amber animate-pulse">
            {processingSales}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Valor Total</p>
          <p className="text-2xl font-bold font-mono mt-1 text-accent-green">
            {formatBRL(totalAmount)}
          </p>
        </div>
      </div>

      {/* Sales table */}
      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-sm font-semibold text-slate-300">Notas Fiscais</h2>
        </div>

        {sales.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 text-sm">Nenhuma nota fiscal emitida</p>
            <p className="text-slate-600 text-xs mt-1">
              Crie uma nova venda para começar
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
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b border-dark-border/50 hover:bg-dark-bg/50 transition-colors"
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSale(null)}
        >
          <div
            className="card max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalhes da Nota</h3>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-slate-500 hover:text-slate-300 text-xl"
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
