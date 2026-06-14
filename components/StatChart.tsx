"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ChartDatum {
  label: string;
  value: number;
}

const COLORS = ["#10b981", "#22c55e", "#34d399", "#4ade80", "#6ee7b7"];

export function BarChartCard({
  data,
  height = 280,
  color = "#10b981",
  multicolor = false,
}: {
  data: ChartDatum[];
  height?: number;
  color?: string;
  multicolor?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!data.length)
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Grafik için yeterli veri yok.
      </p>
    );

  return (
    <div style={{ width: "100%", height }}>
      {!mounted ? null : (
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
        >
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#1e293b" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={{ fill: "#cbd5e1", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              fontSize: 12,
              color: "#e2e8f0",
            }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} fill={color}>
            {multicolor &&
              data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
