import { useEffect, useRef } from "react";

export function useLocalReminder(enabled: boolean | undefined, reminderTime: string | undefined, onTrigger: () => void) {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!enabled || !reminderTime) return;

    const [hours, minutes] = reminderTime.split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    timeoutRef.current = window.setTimeout(onTrigger, target.getTime() - now.getTime());

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [enabled, onTrigger, reminderTime]);
}
