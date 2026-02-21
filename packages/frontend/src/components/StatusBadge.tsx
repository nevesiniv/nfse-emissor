interface StatusBadgeProps {
  status: string;
}

function Spinner() {
  return (
    <svg className="w-3 h-3 animate-spin-slow" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
      <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3 animate-bounce-check" viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="w-3 h-3 animate-shake" viewBox="0 0 16 16" fill="none">
      <path d="M8 4v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="12" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "SUCCESS":
      return (
        <span className="badge-success">
          <CheckIcon />
          SUCESSO
        </span>
      );
    case "ERROR":
      return (
        <span className="badge-error">
          <ErrorIcon />
          ERRO
        </span>
      );
    case "PROCESSING":
      return (
        <span className="badge-processing animate-pulse-glow">
          <Spinner />
          PROCESSANDO
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-500/15 text-slate-400">
          {status}
        </span>
      );
  }
}
