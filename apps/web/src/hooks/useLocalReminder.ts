import { useEffect, useRef } from "react";

export function useLocalReminder(
  enabled: boolean | undefined,
  reminderTime: string | undefined,
  eveningReviewTime: string | undefined,
  onTrigger: () => void,
  onEveningTrigger: () => void,
) {
  const timeoutRef = useRef<number | null>(null);
  const eveningTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current) { window.clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (!enabled || !reminderTime) return;

    const [hours, minutes] = reminderTime.split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    timeoutRef.current = window.setTimeout(onTrigger, target.getTime() - now.getTime());

    return () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current); };
  }, [enabled, onTrigger, reminderTime]);

  useEffect(() => {
    if (eveningTimeoutRef.current) { window.clearTimeout(eveningTimeoutRef.current); eveningTimeoutRef.current = null; }
    if (!enabled || !eveningReviewTime) return;

    const [hours, minutes] = eveningReviewTime.split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);

    eveningTimeoutRef.current = window.setTimeout(() => {
      // Browser notification
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("Bloom", { body: "来看看今天的成长小结 🌙", icon: "/favicon-64x64.png" });
      }
      onEveningTrigger();
    }, target.getTime() - now.getTime());

    return () => { if (eveningTimeoutRef.current) window.clearTimeout(eveningTimeoutRef.current); };
  }, [enabled, eveningReviewTime, onEveningTrigger]);
}
