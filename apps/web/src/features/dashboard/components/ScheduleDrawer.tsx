import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DailyTask } from "@bloom/shared";
import { Button } from "@/components/Button";

export function ScheduleDrawer({
  open,
  tasks,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: {
  open: boolean;
  tasks: DailyTask[];
  onClose: () => void;
  onAdd: (title: string, time: string) => Promise<void>;
  onUpdate: (taskId: string, title: string, time: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("21:30 - 22:00");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<DailyTask[]>(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const viewTasks = useMemo(() => localTasks, [localTasks]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[#120D22]/32 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-[520px] flex-col border-l border-line bg-white p-6 shadow-card dark:bg-[#171127]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-500">Schedule</div>
            <h3 className="mt-2 text-[28px] font-semibold tracking-tight text-text">完整今日日程</h3>
            <p className="mt-2 text-sm text-muted">可以手动补充日程，也可以从成长对话中让 Bloom 帮你生成。</p>
          </div>
          <button className="interactive rounded-2xl bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600" onClick={onClose}>关闭</button>
        </div>

        <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
          {viewTasks.map((task) => (
            <div key={task.id} className="rounded-[22px] border border-line bg-surface/70 px-4 py-4 dark:bg-[#1B1531]">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-text">{task.title}</div>
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">{task.tag}</span>
              </div>
              <div className="mt-2 text-sm text-muted">{task.time}</div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  className="interactive inline-flex items-center gap-2 text-sm font-semibold text-primary-500"
                  onClick={() => {
                    setEditingId(task.id);
                    setTitle(task.title);
                    setTime(task.time);
                  }}
                >
                  <Pencil className="h-4 w-4" /> 修改
                </button>
                <button
                  className="interactive inline-flex items-center gap-2 text-sm font-semibold text-[#E05968]"
                  onClick={async () => {
                    await onDelete(task.id);
                    setLocalTasks((state) => state.filter((item) => item.id !== task.id));
                  }}
                >
                  <Trash2 className="h-4 w-4" /> 删除
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[24px] border border-line bg-surface/70 p-4 dark:bg-[#1B1531]">
          <div className="text-sm font-semibold text-text">{editingId ? "修改日程" : "手动添加日程"}</div>
          <div className="mt-3 grid gap-3">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="如：整理用户访谈记录" className="rounded-[18px] border border-line bg-white px-4 py-3 text-sm outline-none dark:bg-[#171127]" />
            <input value={time} onChange={(event) => setTime(event.target.value)} placeholder="如：21:30 - 22:00" className="rounded-[18px] border border-line bg-white px-4 py-3 text-sm outline-none dark:bg-[#171127]" />
            <div className="flex gap-3">
              <Button
                onClick={async () => {
                  if (!title.trim()) return;
                  if (editingId) {
                    await onUpdate(editingId, title.trim(), time.trim());
                    setLocalTasks((state) => state.map((task) => (task.id === editingId ? { ...task, title: title.trim(), time: time.trim() } : task)));
                    setEditingId(null);
                    setTitle("");
                    setTime("21:30 - 22:00");
                    return;
                  }
                  await onAdd(title.trim(), time.trim());
                  setTitle("");
                }}
              >
                {editingId ? "保存修改" : "保存日程"}
              </Button>
              {editingId ? (
                <Button variant="secondary" onClick={() => {
                  setEditingId(null);
                  setTitle("");
                  setTime("21:30 - 22:00");
                }}>
                  取消
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
