import clsx from "clsx";
import type { PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
  className?: string;
}

export function Card({ className, children }: CardProps) {
  return <section className={clsx("rounded-panel border border-line bg-panel shadow-card transition-colors", className)}>{children}</section>;
}
