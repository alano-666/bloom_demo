import { useEffect } from "react";

export function useTheme(enabled: boolean | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [enabled]);
}
