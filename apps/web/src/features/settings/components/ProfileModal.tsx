import { useEffect, useMemo, useState } from "react";
import { CalendarClock, LogOut, Sparkles } from "lucide-react";
import { apiClient } from "@/lib-api";
import { Button } from "@/components/Button";
import { WheelSelect } from "@/components/WheelSelect";
import { useBloomStore } from "@/store/useBloomStore";
import { useAuthStore } from "@/store/useAuthStore";

const gradeOptions = ["高中", "大一", "大二", "大三", "大四", "研究生", "职场初期", "职场过渡期", "转行阶段"];

export function ProfileModal() {
  const { bootstrap, profileModalOpen, setProfileModalOpen, setBootstrap } = useBloomStore();
  const { logout, syncProfile } = useAuthStore();
  const profile = bootstrap?.profile;
  const [form, setForm] = useState({
    name: profile?.name ?? "",
    grade: profile?.grade ?? gradeOptions[0],
    mainGoal: profile?.mainGoal ?? "",
    mainProblem: profile?.mainProblem ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        grade: profile.grade,
        mainGoal: profile.mainGoal,
        mainProblem: profile.mainProblem,
      });
    }
  }, [profile]);

  const hasChanges = useMemo(
    () =>
      Boolean(
        profile &&
          (form.name !== profile.name ||
            form.grade !== profile.grade ||
            form.mainGoal !== profile.mainGoal ||
            form.mainProblem !== profile.mainProblem),
      ),
    [form, profile],
  );

  if (!profileModalOpen || !profile) return null;

  const save = async () => {
    if (!hasChanges || isSaving) return;
    setIsSaving(true);
    try {
      const next = await apiClient.updateProfile({
        name: form.name,
        username: form.name,
        grade: form.grade,
        mainGoal: form.mainGoal,
        mainProblem: form.mainProblem,
      });
      setBootstrap(next);
      syncProfile({ email: next.profile?.email, username: next.profile?.username ?? form.name });
      setProfileModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    setProfileModalOpen(false);
    window.location.href = "/auth";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#120D22]/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[680px] rounded-[32px] border border-white/10 bg-white p-7 shadow-card dark:bg-[#171127]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-500">Profile</div>
            <h3 className="mt-2 text-[30px] font-semibold tracking-tight text-text">个人信息</h3>
            <p className="mt-2 text-sm text-muted">在这里编辑个人信息，并调整登录相关设置。</p>
          </div>
          <button className="interactive rounded-2xl bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600" onClick={() => setProfileModalOpen(false)}>
            关闭
          </button>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="个人名称" value={form.name} onChange={(value) => setForm((state) => ({ ...state, name: value }))} icon={<Sparkles className="h-4 w-4" />} />
          <div>
            <div className="mb-3 text-sm font-semibold text-text">阶段 / 年级</div>
            <div className="rounded-[22px] border border-line bg-surface px-4 py-3 dark:bg-[#1B1531]">
              <WheelSelect value={form.grade} options={gradeOptions} onChange={(value) => setForm((state) => ({ ...state, grade: value }))} />
            </div>
          </div>
          <div className="rounded-[22px] border border-line bg-surface px-4 py-4 text-sm dark:bg-[#1B1531] md:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">登录邮箱</div>
            <div className="mt-2 font-medium text-text">{profile.email}</div>
            <div className="mt-3 text-xs text-muted">当前为演示环境，邮箱修改仅作展示。</div>
          </div>
        </div>

        <div className="mt-5 grid gap-5">
          <Textarea label="近阶段主要目标" value={form.mainGoal} onChange={(value) => setForm((state) => ({ ...state, mainGoal: value }))} />
          <Textarea label="现阶段主要问题" value={form.mainProblem} onChange={(value) => setForm((state) => ({ ...state, mainProblem: value }))} />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button className="interactive inline-flex items-center gap-2 rounded-2xl border border-line px-4 py-3 text-sm font-semibold text-[#E05968]" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> 退出登录
          </button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setProfileModalOpen(false)}>取消</Button>
            <Button onClick={save} disabled={!hasChanges || isSaving}>{isSaving ? "保存中..." : "保存资料"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, icon }: { label: string; value: string; onChange: (value: string) => void; icon: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold text-text">{label}</div>
      <div className="flex items-center gap-3 rounded-[22px] border border-line bg-surface px-4 py-4 text-sm dark:bg-[#1B1531]">
        <span className="text-muted">{icon}</span>
        <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-transparent outline-none" />
      </div>
    </div>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold text-text">{label}</div>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="w-full rounded-[22px] border border-line bg-surface px-4 py-4 text-sm outline-none dark:bg-[#1B1531]" />
    </div>
  );
}
