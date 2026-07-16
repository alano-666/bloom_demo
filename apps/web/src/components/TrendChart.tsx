import { useMemo } from "react";
import { ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line, CartesianGrid } from "recharts";
import type { TrendPoint } from "@bloom/shared";
import { Card } from "./Card";

interface TrendChartProps {
  data: TrendPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  const latest = useMemo(() => data[data.length - 1], [data]);

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">成长值趋势</p>
          <h3 className="mt-1 text-lg font-semibold text-text">本周成长曲线</h3>
        </div>
        {latest ? <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">最新 {latest.score}</span> : null}
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, bottom: 4, left: -20 }}>
            <CartesianGrid vertical={false} stroke="#EEEAF9" strokeDasharray="3 6" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#8C86A3", fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#8C86A3", fontSize: 12 }}
              domain={[0, 120]}
              ticks={[20, 40, 60, 80, 100, 120]}
            />
            <Tooltip
              cursor={{ stroke: "#CBB9FF", strokeWidth: 1.5, strokeDasharray: "4 4" }}
              contentStyle={{ borderRadius: 18, border: "1px solid #ECE8FA", boxShadow: "0 12px 30px rgba(93, 60, 196, 0.12)" }}
              formatter={(value) => [`${value}`, "成长值"]}
              labelStyle={{ color: "#7F7898" }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#7C4DFF"
              strokeWidth={3}
              dot={{ r: 0 }}
              activeDot={{ r: 6, fill: "#7C4DFF", stroke: "#FFFFFF", strokeWidth: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
