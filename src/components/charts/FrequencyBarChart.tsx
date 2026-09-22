import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FrequencyBarChartProps = {
  data: Array<{ name: string; count: number }>;
  ariaLabel?: string;
};

export function FrequencyBarChart({ data, ariaLabel }: FrequencyBarChartProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <div className="h-48 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={50}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
          <Tooltip />
          <Bar dataKey="count" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
