import clsx from "clsx";

interface MetricCardProps {
  label: string;
  value: string | number;
  hint: string;
  className?: string;
}

export function MetricCard({ label, value, hint, className }: MetricCardProps) {
  return (
    <div className={clsx("rounded-[24px] border border-line bg-white p-5 transition-colors dark:bg-[#1C1536]", className)}>
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-[34px] font-semibold leading-none text-text">{value}</span>
        <span className="pb-1 text-xs font-medium text-primary-500">{hint}</span>
      </div>
    </div>
  );
}
