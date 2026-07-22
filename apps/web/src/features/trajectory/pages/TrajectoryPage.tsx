import { useEffect } from "react";
import { apiClient } from "@/lib-api";
import { Card } from "@/components/Card";
import { MetricCard } from "@/components/MetricCard";
import { RadarChart } from "@/components/RadarChart";
import { SectionTitle } from "@/components/SectionTitle";
import { TrendChart } from "@/components/TrendChart";
import { useBloomStore } from "@/store/useBloomStore";

export function TrajectoryPage() {
  const { trajectory, setTrajectory } = useBloomStore();

  useEffect(() => {
    if (!trajectory) {
      apiClient.getTrajectory().then(setTrajectory);
    }
  }, [setTrajectory, trajectory]);

  if (!trajectory) {
    return <div className="p-10 text-muted">正在加载成长轨迹…</div>;
  }

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Trajectory" title="成长轨迹" subtitle="从趋势、能力、习惯与情绪四个维度，看见你持续积累的证据。" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="成长总览" value={trajectory.overview.score} hint={`+${trajectory.overview.delta}%`} />
        <MetricCard label="记录天数" value={trajectory.overview.days} hint="本月已记录" />
        <MetricCard label="专注时长" value={`${trajectory.overview.focusHours} h`} hint="累计" />
        <MetricCard label="关键事件" value={trajectory.timeline.length} hint="近期高光" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <TrendChart data={trajectory.trend} />
        <RadarChart data={trajectory.radar} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <div className="mb-5">
            <p className="text-sm text-muted">近期养成的习惯</p>
            <h3 className="mt-1 text-lg font-semibold text-text">由近期对话与行动抽取出的稳定习惯</h3>
          </div>
          <div className="grid gap-3">
            {trajectory.habits.map((habit, i) => {
              const colors = ["text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20", "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-900/20", "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20", "text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-900/20"];
              const color = colors[i % colors.length];
              return (
                <div key={habit} className="flex items-center gap-3 rounded-[20px] bg-surface/80 px-5 py-4 text-sm dark:bg-[#1B1531]">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${color}`}>{i + 1}</div>
                  <span className="font-medium text-text">{habit}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5">
            <p className="text-sm text-muted">情绪状态</p>
            <h3 className="mt-1 text-lg font-semibold text-text">基于历史对话识别的情绪标签</h3>
          </div>
          <div className="space-y-4">
            {trajectory.emotions.map((emotion, i) => {
              const maxCount = Math.max(...trajectory.emotions.map((e) => e.count), 1);
              const barPercent = Math.round((emotion.count / maxCount) * 100);
              const barColors = ["bg-gradient-to-r from-violet-400 to-violet-500", "bg-gradient-to-r from-sky-400 to-sky-500", "bg-gradient-to-r from-amber-400 to-amber-500", "bg-gradient-to-r from-rose-400 to-rose-500"];
              const barColor = barColors[i % barColors.length];
              return (
                <div key={emotion.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-text">{emotion.label}</span>
                    <span className="text-xs font-semibold text-muted">{emotion.count} 次</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-surface/80 dark:bg-[#1B1531] overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${barPercent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-5">
          <p className="text-sm text-muted">成长事件时间轴</p>
          <h3 className="mt-1 text-lg font-semibold text-text">最近发生的重要时刻</h3>
        </div>
        <div className="space-y-5">
          {trajectory.timeline.map((item, index) => (
            <div key={`${item.date}-${index}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3.5 w-3.5 rounded-full bg-primary-500" />
                {index < trajectory.timeline.length - 1 ? <div className="mt-2 h-full w-px bg-line" /> : null}
              </div>
              <div className="flex-1 rounded-[22px] border border-line bg-surface/70 px-5 py-4 dark:bg-[#1B1531]">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold text-text">{item.date}</div>
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">+{item.score}</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-text">{item.title}</p>
                <div className="mt-3 text-xs font-medium text-muted">{item.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
