import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={clsx(
        "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-white text-muted transition-all duration-150 hover:bg-surface hover:text-text active:scale-[0.98] dark:bg-[#201A39] dark:text-[#CAC4E8] dark:hover:bg-[#2A2346]",
        className,
      )}
      {...props}
    />
  );
}
