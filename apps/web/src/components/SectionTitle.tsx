import clsx from "clsx";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionTitle({ eyebrow, title, subtitle, className }: SectionTitleProps) {
  return (
    <div className={clsx("space-y-1", className)}>
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">{eyebrow}</p> : null}
      <h2 className="text-[28px] font-semibold tracking-tight text-text">{title}</h2>
      {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}
