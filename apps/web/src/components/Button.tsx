import clsx from "clsx";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
}

export function Button({ children, className, variant = "primary", fullWidth, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "interactive inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:cursor-not-allowed disabled:opacity-50",
        fullWidth && "w-full",
        variant === "primary" && "bg-primary-500 text-white shadow-soft hover:bg-primary-600",
        variant === "secondary" && "border border-line bg-white text-text hover:bg-surface dark:bg-[#201A39] dark:hover:bg-[#2A2346]",
        variant === "ghost" && "bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-[#261D46] dark:text-[#D8CDFF]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
