import { PolarAngleAxis, PolarGrid, Radar, RadarChart as RechartRadarChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { RadarPoint } from "@bloom/shared";
import { Card } from "./Card";

interface RadarChartProps {
  data: RadarPoint[];
}

export function RadarChart({ data }: RadarChartProps) {
  return (
    <Card className="p-6">
      <div className="mb-5">
        <p className="text-sm text-muted">能力雷达图</p>
        <h3 className="mt-1 text-lg font-semibold text-text">能力发展画像</h3>
      </div>
      <div className="h-[270px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartRadarChart outerRadius="78%" data={data}>
            <PolarGrid stroke="#ECE8FA" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#7F7898", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: 18, border: "1px solid #ECE8FA", boxShadow: "0 12px 30px rgba(93, 60, 196, 0.12)" }}
            />
            <Legend iconType="circle" formatter={(value) => <span style={{ color: "#191531", fontSize: 12 }}>{value}</span>} />
            <Radar name="本期" dataKey="current" stroke="#7C4DFF" fill="#7C4DFF" fillOpacity={0.18} strokeWidth={2.5} />
            <Radar name="上期" dataKey="previous" stroke="#C6B5FF" fill="#C6B5FF" fillOpacity={0.12} strokeWidth={2} />
          </RechartRadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
