interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "SUCCESS":
      return <span className="badge-success">SUCESSO</span>;
    case "ERROR":
      return <span className="badge-error">ERRO</span>;
    case "PROCESSING":
      return <span className="badge-processing">PROCESSANDO</span>;
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-500/15 text-slate-400">
          {status}
        </span>
      );
  }
}
