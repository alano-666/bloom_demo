import { Flag, PauseCircle, X } from "lucide-react";
import { Button } from "@/components/Button";

export function FocusOverlay({
  secondsLeft,
  onPause,
  onEndTask,
  onClose,
  isSubmitting,
  error,
}: {
  secondsLeft: number;
  onPause: () => void;
  onEndTask: () => void;
  onClose: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const safeSeconds = Number.isFinite(secondsLeft) ? Math.max(0, secondsLeft) : 0;
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0A1F]/96 px-6 backdrop-blur-sm">
      <div className="w-full max-w-[760px] rounded-[40px] border border-[#4D3B81]/40 bg-[radial-gradient(circle_at_top,rgba(196,180,255,0.95),rgba(233,226,255,0.98),rgba(242,238,255,1))] px-10 py-12 text-center shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
        <div className="mx-auto inline-flex items-center gap-3 rounded-full border border-[#B49FFF] bg-white/70 px-5 py-3 text-sm font-semibold text-[#5C32C5]">
          Bloom 专注模式已开启
        </div>
        <div className="mt-8 text-sm uppercase tracking-[0.32em] text-[#7C4DFF]">本次专注倒计时</div>
        <div className="mt-5 text-[124px] font-semibold leading-none tracking-tight text-[#47239A] drop-shadow-[0_10px_30px_rgba(124,77,255,0.18)]">
          {minutes}:{seconds}
        </div>
        <p className="mx-auto mt-6 max-w-[560px] text-lg leading-9 text-[#6E59A5]">
          屏幕已经为你暗下来。现在请只专注处理这一件最重要的事，结束后 Bloom 会同步更新任务进度与成长数据。
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            <button className="ml-3 inline-flex items-center gap-1 font-semibold" onClick={onClose}>
              <X className="h-4 w-4" /> 关闭专注页
            </button>
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Button disabled={isSubmitting} variant="secondary" className="border-[#D8CFFF] bg-white/85 text-[#5C32C5] hover:bg-white" onClick={onPause}>
            <PauseCircle className="mr-2 h-4 w-4" /> {isSubmitting ? "正在保存..." : "暂停专注"}
          </Button>
          <Button disabled={isSubmitting} className="bg-[#6F3FEA] hover:bg-[#5C32C5]" onClick={onEndTask}>
            <Flag className="mr-2 h-4 w-4" /> {isSubmitting ? "正在保存..." : "结束任务"}
          </Button>
        </div>
      </div>
    </div>
  );
}
