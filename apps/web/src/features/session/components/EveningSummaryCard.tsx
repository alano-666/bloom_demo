import { MoonStar } from "lucide-react";

export function EveningSummaryCard({ content }: { content: string }) {
  return (
    <div className="mt-3 rounded-[26px] border border-[#DCCBFF] bg-[linear-gradient(180deg,rgba(243,238,255,0.96),rgba(233,225,255,0.88))] px-5 py-5 shadow-soft dark:border-[#3A2F62] dark:bg-[linear-gradient(180deg,rgba(51,39,90,0.92),rgba(36,28,63,0.96))]">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#6B46D9] dark:bg-white/10 dark:text-[#D8CDFF]">
        <MoonStar className="h-4 w-4" /> 晚间成长总结
      </div>
      <div className="whitespace-pre-wrap text-sm leading-7 text-text dark:text-[#F3EFFF]">{content}</div>
    </div>
  );
}
