import { useMemo } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import type { OnboardingInput } from "@bloom/shared";
import { Sparkles } from "lucide-react";
import { apiClient } from "@/lib-api";
import { Button } from "@/components/Button";
import { useBloomStore } from "@/store/useBloomStore";

const stages: NonNullable<OnboardingInput["stage"]>[] = ["学生", "求职", "职场", "创业"];
const directions: NonNullable<OnboardingInput["growthDirection"]>[] = ["职业", "健康", "学习", "生活"];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { bootstrap, setBootstrap } = useBloomStore();
  const { register, handleSubmit, watch } = useForm<OnboardingInput>({
    defaultValues: {
      name: bootstrap?.profile?.name ?? "Luna",
      username: bootstrap?.profile?.username ?? "Luna",
      email: bootstrap?.profile?.email ?? "luna@bloom.demo",
      grade: bootstrap?.profile?.grade ?? "大四 / 职场过渡期",
      age: bootstrap?.profile?.age ?? 24,
      stage: bootstrap?.profile?.stage ?? "职场",
      growthDirection: bootstrap?.profile?.growthDirection ?? "职业",
      longTermGoal: bootstrap?.profile?.mainGoal ?? "进入字节产品团队，形成自己的产品分析方法论",
      currentChallenge: bootstrap?.profile?.mainProblem ?? "最近在做竞品分析，但不知道如何输出更有价值的洞察",
      mainGoal: bootstrap?.profile?.mainGoal ?? "进入字节产品团队，形成自己的产品分析方法论",
      mainProblem: bootstrap?.profile?.mainProblem ?? "最近在做竞品分析，但不知道如何输出更有价值的洞察",
    },
  });

  const values = watch();
  const progress = useMemo(() => {
    let filled = 0;
    if (values.name) filled += 1;
    if (values.grade) filled += 1;
    if (values.stage) filled += 1;
    if (values.growthDirection) filled += 1;
    if (values.longTermGoal) filled += 1;
    if (values.currentChallenge) filled += 1;
    return Math.round((filled / 6) * 100);
  }, [values]);

  const onSubmit = handleSubmit(async (payload) => {
    const result = await apiClient.submitOnboarding(payload);
    setBootstrap(result);
    navigate("/dashboard");
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(194,181,255,0.2),transparent_22%),#F6F4FF] px-6 py-8 dark:bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(194,181,255,0.1),transparent_22%),#120D22]">
      <div className="grid w-full max-w-[1220px] gap-8 rounded-[36px] border border-white/70 bg-white/80 p-8 shadow-card backdrop-blur dark:border-white/10 dark:bg-white/5 xl:grid-cols-[0.9fr_1.1fr] xl:p-10">
        <div className="rounded-[30px] bg-[linear-gradient(180deg,#7C4DFF,#9467FF)] p-8 text-white shadow-soft">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/16">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="mt-8 text-[40px] font-semibold leading-tight">欢迎来到 Bloom</h1>
          <p className="mt-4 max-w-[420px] text-sm leading-7 text-white/80">
            我会记住你的长期目标、最近困扰和成长节奏，帮助你把每一天都过成有连续性的进步。
          </p>

          <div className="mt-10 rounded-[26px] border border-white/10 bg-white/10 p-5">
            <div className="text-sm text-white/80">当前建档进度</div>
            <div className="mt-3 text-[42px] font-semibold">{progress}%</div>
            <div className="mt-4 h-2 rounded-full bg-white/15">
              <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <form className="grid gap-5" onSubmit={onSubmit}>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-500">Onboarding</div>
            <h2 className="mt-2 text-[34px] font-semibold tracking-tight text-text">补齐你的成长画像</h2>
            <p className="mt-3 text-sm leading-7 text-muted">如果你希望 Bloom 更懂你，可以在这里补充阶段、目标与当前问题。</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="你希望我怎么称呼你？">
              <input {...register("name")} className="w-full rounded-[22px] border border-line bg-surface px-5 py-4 outline-none dark:bg-[#1B1531]" />
            </Field>
            <Field label="你当前处于哪个阶段 / 年级？">
              <input {...register("grade")} className="w-full rounded-[22px] border border-line bg-surface px-5 py-4 outline-none dark:bg-[#1B1531]" />
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="你现在处于什么阶段？">
              <select {...register("stage")} className="w-full rounded-[22px] border border-line bg-surface px-5 py-4 outline-none dark:bg-[#1B1531]">
                {stages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="你现在最想成长的方向是什么？">
              <select {...register("growthDirection")} className="w-full rounded-[22px] border border-line bg-surface px-5 py-4 outline-none dark:bg-[#1B1531]">
                {directions.map((direction) => (
                  <option key={direction} value={direction}>
                    {direction}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="你的一个长期目标是什么？">
            <textarea {...register("longTermGoal")} rows={3} className="w-full rounded-[22px] border border-line bg-surface px-5 py-4 outline-none dark:bg-[#1B1531]" />
          </Field>

          <Field label="最近最困扰你的一件事是什么？">
            <textarea {...register("currentChallenge")} rows={4} className="w-full rounded-[22px] border border-line bg-surface px-5 py-4 outline-none dark:bg-[#1B1531]" />
          </Field>

          <div className="pt-2">
            <Button type="submit" fullWidth>
              完成补充并进入 Bloom
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-3">
      <div className="text-sm font-semibold text-text">{label}</div>
      {children}
    </label>
  );
}
