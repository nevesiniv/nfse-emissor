interface SkeletonProps {
  className?: string;
}

function SkeletonBox({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card-static space-y-3">
      <SkeletonBox className="h-3 w-24" />
      <SkeletonBox className="h-8 w-20" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr className="border-b border-dark-border/50">
      <td className="px-4 py-3"><SkeletonBox className="h-4 w-28" /></td>
      <td className="px-4 py-3"><SkeletonBox className="h-4 w-40" /></td>
      <td className="px-4 py-3"><SkeletonBox className="h-4 w-24" /></td>
      <td className="px-4 py-3"><SkeletonBox className="h-4 w-20 ml-auto" /></td>
      <td className="px-4 py-3 flex justify-center"><SkeletonBox className="h-5 w-24 rounded-full" /></td>
      <td className="px-4 py-3"><SkeletonBox className="h-4 w-16 mx-auto" /></td>
    </tr>
  );
}

export function SkeletonCertRow() {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <SkeletonBox className="h-5 w-5 rounded-full" />
        <div className="space-y-1.5">
          <SkeletonBox className="h-4 w-36" />
          <SkeletonBox className="h-3 w-24" />
        </div>
      </div>
      <SkeletonBox className="h-4 w-16" />
    </div>
  );
}

export default SkeletonBox;
