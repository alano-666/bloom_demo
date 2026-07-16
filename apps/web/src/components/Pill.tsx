import clsx from "clsx";
import type { PropsWithChildren } from "react";

interface PillProps extends PropsWithChildren {
  active?: boolean;
  onClick?: () => void;
}

export function Pill({ active, children, onClick }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "interactive rounded-full px-4 py-2 text-sm font-medium transition-all duration-150",
        active ? "bg-primary-500 text-white shadow-soft" : "bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-[#261D46] dark:text-[#D8CDFF]",
      )}
    >
      {children}
    </button>
  );
}
