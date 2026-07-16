import { useEffect, useState } from "react";
import type { ReportPeriod } from "@bloom/shared";
import { ChevronDown, ChevronUp } from "lucide-react";
import { apiClient } from "@/lib-api";
import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { ScoreRing } from "@/components/ScoreRing";
import { SectionTitle } from "@/components/SectionTitle";
import { useBloomStore } from "@/store/useBloomStore";

const periods: { value: ReportPeriod; label: string }[] = [
  { value: "week", label: "周报" },
  { value: "month", label: "月报" },
  { value: "quarter", label: "季度" },
  { value: "year", label: "年度" },
];

export function ReportsPage() {
  const { report, setReport } = useBloomStore();
  const [activePeriod, setActivePeriod] = useState<ReportPeriod>("week");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  useEffect(() => {
    apiClient.getReport(activePeriod).then((next) => {
      setReport(next);
      setExpandedIds([]);
    });
  }, [activePeriod, setReport]);

  if (!report) {
    return <div className="p-10 text-muted">正在加载周期报告…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <SectionTitle eyebrow="Reflection" title="周期报告" subtitle="系统回顾最近一段时间的成长进展，把你的努力变成可见成果。" />
        <div className="flex flex-wrap gap-3">
          {periods.map((period) => (
            <Pill key={period.value} active={period.value === activePeriod} onClick={() => setActivePeriod(period.value)}>
              {period.label}
            </Pill>
          ))}
        </div>
      </div>

      <Card className="grid gap-6 p-6 xl:grid-cols-[1.25fr_260px] xl:items-center">
        <div>
          <div className="text-sm text-muted">{report.rangeLabel}</div>
          <h3 className="mt-3 text-[32px] font-semibold tracking-tight text-text">{report.title}</h3>
          <p className="mt-4 max-w-[720px] text-[15px] leading-7 text-muted">{report.summary}</p>

          <div className="mt-6 space-y-3">
            <div className="text-sm font-semibold text-text">本期亮点（点击展开详情）</div>
            {report.highlights.map((highlight) => {
              const expanded = expandedIds.includes(highlight.id);
              return (
                <button
                  key={highlight.id}
                  onClick={() =>
                    setExpandedIds((state) => (expanded ? state.filter((id) => id !== highlight.id) : [...state, highlight.id]))
                  }
                  className="interactive block w-full rounded-[18px] bg-surface/80 px-4 py-4 text-left dark:bg-[#1B1531]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-text">{highlight.title}</div>
                      <div className="mt-1 text-sm text-muted">{highlight.summary}</div>
                    </div>
                    {expanded ? <ChevronUp className="h-4 w-4 text-primary-500" /> : <ChevronDown className="h-4 w-4 text-primary-500" />}
                  </div>
                  {expanded ? <div className="mt-4 rounded-[16px] bg-white px-4 py-4 text-sm leading-7 text-text dark:bg-[#171127]">{highlight.detail}</div> : null}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-center">
          <ScoreRing score={report.score} delta={report.delta} />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {report.stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-sm text-muted">{stat.label}</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-[34px] font-semibold leading-none text-text">{stat.value}</span>
              <span className="pb-1 text-xs font-semibold text-primary-500">{stat.hint}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <p className="text-sm text-muted">下周建议</p>
        <h3 className="mt-1 text-lg font-semibold text-text">继续把成长转成结构化成果</h3>
        <p className="mt-4 max-w-[880px] text-[15px] leading-7 text-text">{report.nextSuggestion}</p>
      </Card>
    </div>
  );
}
