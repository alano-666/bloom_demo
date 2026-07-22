import { useEffect, useState } from "react";
import type { GrowthDirection } from "@bloom/shared";
import { apiClient } from "@/lib-api";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionTitle } from "@/components/SectionTitle";
import { useBloomStore } from "@/store/useBloomStore";

const categories: GrowthDirection[] = ["职业", "学习", "健康", "生活"];

export function GoalsPage() {
  const { bootstrap, setBootstrap, updateGoals, updateDashboard, setTrajectory, setReport } = useBloomStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [draft, setDraft] = useState({ title: "", category: "职业" as GrowthDirection, targetDate: "2026-08-20", note: "" });
  const [progressGoalId, setProgressGoalId] = useState<string | null>(null);
  const [progressDraft, setProgressDraft] = useState({ note: "", progressDelta: 6 });

  useEffect(() => {
    if (!bootstrap) apiClient.getBootstrap().then(setBootstrap);
  }, [bootstrap, setBootstrap]);

  const goals = bootstrap?.goals ?? [];

  const createGoal = async () => {
    if (!draft.title.trim() || !draft.note.trim() || !draft.targetDate.trim() || isSavingGoal) return;
    setIsSavingGoal(true);
    try {
      const nextGoals = await apiClient.createGoal({
        title: draft.title.trim(),
        category: draft.category,
        targetDate: draft.targetDate,
        note: draft.note.trim(),
      });
      updateGoals(nextGoals);
      setCreateOpen(false);
      setDraft({ title: "", category: "学习", targetDate: "", note: "" });
    } catch (error: any) {
      window.alert(error?.response?.data?.error ?? "保存失败，请重试");
    } finally {
      setIsSavingGoal(false);
    }
  };

  const submitProgress = async () => {
    if (!progressGoalId || !progressDraft.note.trim()) return;
    const result = await apiClient.recordGoalProgress(progressGoalId, progressDraft);
    updateGoals(result.goals);
    updateDashboard(result.dashboard);
    setTrajectory(result.trajectory);
    setReport(result.reportSummary);
    setProgressGoalId(null);
    setProgressDraft({ note: "", progressDelta: 6 });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <SectionTitle eyebrow="Goals" title="我的目标" subtitle="把长期目标拆成可以持续推进的小进展，让每天的努力更有方向。" />
          <Button onClick={() => setCreateOpen(true)}>新建目标</Button>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {goals.map((goal) => (
            <Card key={goal.id} className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-muted">{goal.category}</div>
                  <h3 className="mt-1 text-xl font-semibold text-text">{goal.title}</h3>
                </div>
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">连续 {goal.streak} 天</span>
              </div>
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-muted">当前进度</span>
                  <span className="font-semibold text-text">{goal.progress}%</span>
                </div>
                <ProgressBar value={goal.progress} />
              </div>
              <div className="mt-5 rounded-[22px] bg-surface/70 px-4 py-4 text-sm leading-7 text-text dark:bg-[#1B1531]">{goal.note}</div>
              <div className="mt-5 flex items-center justify-between gap-3 text-sm text-muted">
                <span>目标日期：{goal.targetDate}</span>
                <button className="interactive font-semibold text-primary-500" onClick={() => setProgressGoalId(goal.id)}>
                  标记新进展
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {createOpen ? (
        <Modal title="新建目标" description="创建一个可以持续推进的新目标。" onClose={() => setCreateOpen(false)}>
          <div className="space-y-4">
            <Field label="目标内容"><input value={draft.title} onChange={(event) => setDraft((state) => ({ ...state, title: event.target.value }))} className="w-full rounded-[18px] border border-line bg-surface px-4 py-3 outline-none dark:bg-[#1B1531]" /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="分类">
                <select value={draft.category} onChange={(event) => setDraft((state) => ({ ...state, category: event.target.value as GrowthDirection }))} className="w-full rounded-[18px] border border-line bg-surface px-4 py-3 outline-none dark:bg-[#1B1531]">
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </Field>
              <Field label="目标日期"><input type="date" value={draft.targetDate} onChange={(event) => setDraft((state) => ({ ...state, targetDate: event.target.value }))} className="w-full rounded-[18px] border border-line bg-surface px-4 py-3 outline-none dark:bg-[#1B1531]" /></Field>
            </div>
            <Field label="备注"><textarea value={draft.note} onChange={(event) => setDraft((state) => ({ ...state, note: event.target.value }))} rows={3} className="w-full rounded-[18px] border border-line bg-surface px-4 py-3 outline-none dark:bg-[#1B1531]" /></Field>
            <Button fullWidth onClick={createGoal} disabled={isSavingGoal}>{isSavingGoal ? "保存中..." : "保存目标"}</Button>
          </div>
        </Modal>
      ) : null}

      {progressGoalId ? (
        <Modal title="标记新进展" description="输入这次推进的内容，Bloom 会同步更新目标、轨迹和报告。" onClose={() => setProgressGoalId(null)}>
          <div className="space-y-4">
            <Field label="进展说明"><textarea value={progressDraft.note} onChange={(event) => setProgressDraft((state) => ({ ...state, note: event.target.value }))} rows={4} className="w-full rounded-[18px] border border-line bg-surface px-4 py-3 outline-none dark:bg-[#1B1531]" /></Field>
            <Field label="进度增量（1-20）"><input type="number" value={progressDraft.progressDelta} onChange={(event) => setProgressDraft((state) => ({ ...state, progressDelta: Number(event.target.value) }))} className="w-full rounded-[18px] border border-line bg-surface px-4 py-3 outline-none dark:bg-[#1B1531]" /></Field>
            <Button fullWidth onClick={submitProgress}>提交进展</Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function Modal({ title, description, children, onClose }: { title: string; description: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#120D22]/52 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[520px] rounded-[30px] border border-white/10 bg-white p-6 shadow-card dark:bg-[#171127]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[28px] font-semibold tracking-tight text-text">{title}</h3>
            <p className="mt-2 text-sm text-muted">{description}</p>
          </div>
          <button className="interactive rounded-2xl bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600" onClick={onClose}>关闭</button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-3">
      <div className="text-sm font-semibold text-text">{label}</div>
      {children}
    </label>
  );
}
