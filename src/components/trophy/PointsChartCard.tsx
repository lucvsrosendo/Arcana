import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

export type PointsChartDatum = {
  day: string;
  total: number;
};

type PointsChartCardProps = {
  title: string;
  subtitle?: string;
  emptyLabel: string;
  data: PointsChartDatum[];
  className?: string;
};

export function PointsChartCard({
  title,
  subtitle,
  emptyLabel,
  data,
  className,
}: PointsChartCardProps) {
  return (
    <section className={cn("settings-trophy-block", className)}>
      <header className="settings-trophy-head">
        <h3 className="settings-rail-kicker">{title}</h3>
        {subtitle ? <p className="settings-trophy-sub">{subtitle}</p> : null}
      </header>
      {data.length === 0 ? (
        <p className="settings-empty">{emptyLabel}</p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
