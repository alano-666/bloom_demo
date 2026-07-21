import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Sparkles } from "lucide-react";
import { apiClient } from "@/lib-api";
import { useBloomStore } from "@/store/useBloomStore";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { MetricCard } from "@/components/MetricCard";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionTitle } from "@/components/SectionTitle";
import { FocusOverlay } from "@/features/dashboard/components/FocusOverlay";
import { ScheduleDrawer } from "@/features/dashboard/components/ScheduleDrawer";

export function DashboardPage() {
  const { bootstrap, setBootstrap, updateDashboard, updateGoals, setTrajectory, setReport } = useBloomStore();
  const [focusOpen, setFocusOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [decomposedTasks, setDecomposedTasks] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isApplyingFocus, setIsApplyingFocus] = useState(false);
  const [focusMinutesInput, setFocusMinutesInput] = useState<string>("");
  const [focusStartedAt, setFocusStartedAt] = useState<number | null>(null);
  const [focusError, setFocusError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const dashboard = bootstrap?.dashboard;

  useEffect(() => {
    if (!bootstrap) {
      apiClient.getBootstrap()
        .then(setBootstrap)
        .catch(() => {
          console.warn("后端不可用，无法加载个人数据");
          setLoadError(true);
        });
    }
  }, [bootstrap, setBootstrap]);

  useEffect(() => {
    if (!focusOpen || secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [focusOpen, secondsLeft]);

  useEffect(() => {
    if (dashboard?.dailyPlan?.timeBudgetMinutes) {
      setFocusMinutesInput(String(dashboard.dailyPlan.timeBudgetMinutes));
    }
  }, [dashboard?.dailyPlan?.timeBudgetMinutes]);

  const progressValue = useMemo(() => dashboard?.dailyPlan.progress ?? 0, [dashboard]);

  if (!dashboard) {
    return (
      <div className="p-10 text-muted">
        {loadError ? "无法连接后端，个人成长数据尚未加载。请稍后刷新重试。" : "正在加载 Bloom 仪表盘…"}
      </div>
    );
  }

  const greetingTitle = (() => {
    const hour = new Date().getHours();
    const name = dashboard.greeting.replace(/^早上好，/, "");
    if (hour < 6) return `早点休息哦，${name}`;
    if (hour < 11) return `早上好，${name}`;
    if (hour < 14) return `中午好，${name}`;
    if (hour < 22) return `晚上好，${name}`;
    return `早点休息哦，${name}`;
  })();

  const parsedFocusMinutes = Number(focusMinutesInput || dashboard.dailyPlan.timeBudgetMinutes || 25);
  const resolvedFocusMinutes = Number.isFinite(parsedFocusMinutes) ? Math.min(240, Math.max(5, Math.round(parsedFocusMinutes))) : 25;

  const startFocus = () => {
    setFocusError(null);
    setFocusStartedAt(Date.now());
    setSecondsLeft(resolvedFocusMinutes * 60);
    setFocusOpen(true);
  };

  const getFocusedMinutes = () => {
    const elapsedMs = focusStartedAt ? Date.now() - focusStartedAt : (resolvedFocusMinutes * 60 - secondsLeft) * 1000;
    return Math.min(240, Math.max(5, Math.ceil(elapsedMs / 60000)));
  };

  const applyFocusResult = (result: Awaited<ReturnType<typeof apiClient.completeFocus>>) => {
    updateDashboard(result.dashboard);
    updateGoals(result.goals);
    setTrajectory(result.trajectory);
    setReport(result.reportSummary);
    setBootstrap({
      ...(bootstrap ?? { hasOnboarded: true, profile: null, dashboard: result.dashboard, recentThreads: [], goals: result.goals, reportSummary: result.reportSummary, settings: { reminderEnabled: true, reminderWindow: "09:00", eveningReviewTime: "21:00", voiceEnabled: true, imageEnabled: false, personalizedRhythm: true, darkMode: false, fontScale: "中", replyStyle: "治愈陪伴" } }),
      dashboard: result.dashboard,
      goals: result.goals,
      reportSummary: result.reportSummary,
    });
  };

  const submitFocus = async (markDone: boolean) => {
    if (isApplyingFocus) return;
    setIsApplyingFocus(true);
    setFocusError(null);
    try {
      const result = await apiClient.completeFocus(getFocusedMinutes(), markDone);
      applyFocusResult(result);
      setFocusOpen(false);
      setFocusStartedAt(null);
    } catch (error: any) {
      const message = error?.response?.data?.error ?? "无法保存本次专注数据，请检查网络后重试。";
      setFocusError(message);
    } finally {
      setIsApplyingFocus(false);
    }
  };

  const completeFocus = () => submitFocus(true);
  const pauseFocus = () => submitFocus(false);

  const decomposeTask = async () => {
    const result = await apiClient.decomposeTask();
    setDecomposedTasks(result.tasks);
    window.alert(result.summary);
  };

  return (
    <>
      <div className="space-y-6">
        {loadError ? (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
            ⚠️ 后端服务不可用，当前显示离线演示数据。部分功能（AI 对话、任务生成等）暂不可用。
          </div>
        ) : null}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <SectionTitle
            eyebrow="Bloom"
            title={greetingTitle}
            subtitle="每一个微小的行动，都会让未来的你更接近想成为的自己。"
          />
          <div className="rounded-[26px] border border-line bg-white px-5 py-4 text-right shadow-card dark:bg-[#1B1531]">
            <div className="text-xs text-muted">今天</div>
            <div className="mt-1 text-sm font-semibold text-text">{dashboard.dateLabel}</div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex rounded-full bg-[#FFF1E8] px-3 py-1 text-xs font-semibold text-[#FF8A4C]">AI 自动生成</div>
                <h3 className="mt-4 text-[32px] font-semibold tracking-tight text-text">{dashboard.dailyPlan.focusTitle}</h3>
                <p className="mt-2 text-sm text-muted">{dashboard.dailyPlan.focusSubtitle}</p>
                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted">
                  <span>预计耗时 {dashboard.dailyPlan.timeBudgetMinutes} 分钟</span>
                  <span>{dashboard.dailyPlan.deadline}</span>
                </div>
                <div className="mt-4 max-w-[220px]">
                  <label className="mb-2 block text-sm font-medium text-text">专注时间（分钟）</label>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={focusMinutesInput}
                    onChange={(event) => setFocusMinutesInput(event.target.value)}
                    className="w-full rounded-[18px] border border-line bg-surface px-4 py-3 text-sm outline-none dark:bg-[#1B1531]"
                  />
                </div>
              </div>
              <div className="rounded-[24px] border border-line bg-surface px-5 py-4 text-center dark:bg-[#1B1531]">
                <div className="text-xs text-muted">任务进度</div>
                <div className="mt-2 text-[30px] font-semibold text-text">{progressValue}%</div>
              </div>
            </div>
            <div className="mt-5">
              <ProgressBar value={progressValue} />
            </div>
            {decomposedTasks.length ? (
              <div className="mt-6 grid gap-3 rounded-[24px] border border-primary-100 bg-primary-50/60 p-4 dark:border-[#30264D] dark:bg-[#261D46]">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary-600"><BrainCircuit className="h-4 w-4" /> Bloom 任务拆解</div>
                {decomposedTasks.map((task) => (
                  <div key={task} className="rounded-[18px] bg-white px-4 py-3 text-sm text-text dark:bg-[#171127]">{task}</div>
                ))}
              </div>
            ) : null}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button onClick={startFocus}>开始专注</Button>
              <Button variant="secondary" onClick={decomposeTask}>拆解任务</Button>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            <MetricCard label="成长值" value={dashboard.growthScore} hint={`/ ${dashboard.growthScoreCap}`} />
            <MetricCard label="成长连续天数" value={`${dashboard.activeDays}天`} hint={`连续 ${dashboard.streakDays} 天`} />
            <MetricCard label="累计专注时长" value={`${dashboard.focusHours} h`} hint="虚拟累计" />
            <MetricCard label="情绪状态" value={dashboard.emotionLabel} hint={dashboard.emotionTrend} />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card className="p-6">
            <div className="flex items-center gap-2 text-primary-500">
              <Sparkles className="h-5 w-5" />
              <p className="text-sm font-semibold">AI 主动提醒</p>
            </div>
            <p className="mt-4 max-w-[540px] text-[15px] leading-7 text-text">{dashboard.reminder}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-muted">
              <span className="rounded-full bg-primary-50 px-3 py-2 text-primary-600">虚拟屏幕时长 {dashboard.screenHours}h</span>
              <span className="rounded-full bg-primary-50 px-3 py-2 text-primary-600">虚拟睡眠时长 {dashboard.sleepHours}h</span>
            </div>
            <button className="interactive mt-6 text-sm font-semibold text-primary-500" onClick={() => window.alert("当前为模拟设备数据提醒，无需接入真实设备。")}>查看详情</button>
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">今日日程</p>
                <h3 className="mt-1 text-lg font-semibold text-text">围绕成长目标安排时间</h3>
              </div>
              <button className="interactive text-sm font-semibold text-primary-500" onClick={() => setDrawerOpen(true)}>查看全部</button>
            </div>
            <div className="space-y-4">
              {dashboard.dailyPlan.schedule.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-start gap-4 rounded-[22px] border border-line px-4 py-4">
                  <span className="mt-1 h-3 w-3 rounded-full bg-primary-500" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-text">{item.title}</div>
                    <div className="mt-1 text-sm text-muted">{item.time}</div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      {item.source === "ai" ? <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-600">AI 解析</span> : null}
                      {item.source === "parsed" ? <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-600">AI 解析</span> : null}
                      {item.source === "manual" ? <span className="rounded-full bg-surface px-3 py-1 text-muted">手动添加</span> : null}
                    </div>
                  </div>
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">{item.tag}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-muted">你也可以前往“成长对话”，让 Bloom 帮你自动生成今天的日程安排。</div>
          </Card>
        </div>
      </div>

      <ScheduleDrawer
        open={drawerOpen}
        tasks={dashboard.dailyPlan.schedule}
        onClose={() => setDrawerOpen(false)}
        onAdd={async (title, time) => {
          const next = await apiClient.addScheduleItem(title, time);
          updateDashboard(next);
        }}
        onUpdate={async (taskId, title, time) => {
          const next = await apiClient.updateScheduleItem(taskId, title, time);
          updateDashboard(next);
        }}
        onDelete={async (taskId) => {
          const next = await apiClient.deleteScheduleItem(taskId);
          updateDashboard(next);
        }}
      />

      {focusOpen ? (
        <FocusOverlay
          secondsLeft={secondsLeft}
          onPause={pauseFocus}
          onEndTask={completeFocus}
          onClose={() => {
            setFocusOpen(false);
            setFocusStartedAt(null);
            setFocusError(null);
          }}
          isSubmitting={isApplyingFocus}
          error={focusError}
        />
      ) : null}
    </>
  );
}
