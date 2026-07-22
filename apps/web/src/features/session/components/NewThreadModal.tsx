import { useState } from "react";
import { Button } from "@/components/Button";

export function NewThreadModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("新的成长会话");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#120D22]/52 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[480px] rounded-[30px] border border-white/10 bg-white p-6 shadow-card dark:bg-[#171127]">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-500">New Thread</div>
        <h3 className="mt-2 text-[28px] font-semibold tracking-tight text-text">新建成长对话</h3>
        <p className="mt-2 text-sm text-muted">输入一个主题，Bloom 会为你创建一段全新的空白对话。</p>

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-5 w-full rounded-[22px] border border-line bg-surface px-4 py-4 text-sm outline-none dark:bg-[#1B1531]"
          placeholder="如：本周求职复盘 / 今天有点焦虑"
        />

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>取消</Button>
          <Button
            disabled={isSubmitting || !title.trim()}
            onClick={async () => {
              if (!title.trim() || isSubmitting) return;
              setIsSubmitting(true);
              await onCreate(title.trim());
              onClose();
            }}
          >
            {isSubmitting ? "创建中..." : "创建对话"}
          </Button>
        </div>
      </div>
    </div>
  );
}
