"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyStat } from "@/lib/admin-stats";

export function CostChart({ data }: { data: DailyStat[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="day"
            fontSize={12}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
          <Tooltip formatter={(value) => [`${value}`, "API 호출"]} />
          <Bar
            dataKey="calls"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
