"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, SectionTitle } from "@/components/ui";

const colors = ["#38bdf8", "#22c55e", "#fbbf24", "#f87171", "#94a3b8"];
const chart = {
  grid: "#263241",
  text: "#9aa7b5",
  tooltipBg: "#101820",
  tooltipBorder: "#334155",
  blue: "#38bdf8",
  green: "#22c55e",
  red: "#f87171",
  gold: "#fbbf24"
};
const tooltipProps = {
  contentStyle: {
    backgroundColor: chart.tooltipBg,
    border: `1px solid ${chart.tooltipBorder}`,
    borderRadius: 8,
    color: "#f4f7fb"
  },
  labelStyle: { color: "#f4f7fb" },
  itemStyle: { color: "#f4f7fb" }
};
type ChartDatum = Record<string, string | number | boolean | null | undefined>;

export function MoodTrendChart({ data }: { data: ChartDatum[] }) {
  return (
    <Card className="h-[300px] sm:h-[340px]">
      <SectionTitle title="Mood, Stress, Energy" />
      <ResponsiveContainer width="100%" height="82%">
        <LineChart data={data}>
          <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: chart.text }} axisLine={{ stroke: chart.grid }} tickLine={{ stroke: chart.grid }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: chart.text }} axisLine={{ stroke: chart.grid }} tickLine={{ stroke: chart.grid }} />
          <Tooltip {...tooltipProps} />
          <Legend wrapperStyle={{ color: chart.text }} />
          <Line type="monotone" dataKey="mood" stroke={chart.green} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="stress" stroke={chart.red} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="energy" stroke={chart.blue} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function SleepMoodChart({ data }: { data: ChartDatum[] }) {
  return (
    <Card className="h-[300px] sm:h-[340px]">
      <SectionTitle title="Sleep vs Mood" />
      <ResponsiveContainer width="100%" height="82%">
        <ScatterChart>
          <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" />
          <XAxis dataKey="sleep" name="Sleep" unit="h" tick={{ fontSize: 12, fill: chart.text }} axisLine={{ stroke: chart.grid }} tickLine={{ stroke: chart.grid }} />
          <YAxis dataKey="mood" name="Mood" domain={[0, 10]} tick={{ fontSize: 12, fill: chart.text }} axisLine={{ stroke: chart.grid }} tickLine={{ stroke: chart.grid }} />
          <Tooltip {...tooltipProps} cursor={{ strokeDasharray: "3 3", stroke: chart.grid }} />
          <Scatter data={data} fill={chart.green} />
        </ScatterChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function WorkoutPerformanceChart({ data }: { data: ChartDatum[] }) {
  return (
    <Card className="h-[300px] sm:h-[340px]">
      <SectionTitle title="Workout Performance Signals" />
      <ResponsiveContainer width="100%" height="82%">
        <ComposedChart data={data}>
          <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: chart.text }} axisLine={{ stroke: chart.grid }} tickLine={{ stroke: chart.grid }} />
          <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 12, fill: chart.text }} axisLine={{ stroke: chart.grid }} tickLine={{ stroke: chart.grid }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: chart.text }} axisLine={{ stroke: chart.grid }} tickLine={{ stroke: chart.grid }} />
          <Tooltip {...tooltipProps} />
          <Legend wrapperStyle={{ color: chart.text }} />
          <Bar yAxisId="right" dataKey="protein" fill={chart.blue} radius={[4, 4, 0, 0]} />
          <Line yAxisId="left" type="monotone" dataKey="performance" stroke={chart.green} strokeWidth={2} />
          <Line yAxisId="left" type="monotone" dataKey="stress" stroke={chart.red} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function HabitCompletionChart({ data }: { data: ChartDatum[] }) {
  return (
    <Card className="h-[300px] sm:h-[340px]">
      <SectionTitle title="Habit Completion" />
      <ResponsiveContainer width="100%" height="82%">
        <BarChart data={data}>
          <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: chart.text }} interval={0} angle={-16} height={54} axisLine={{ stroke: chart.grid }} tickLine={{ stroke: chart.grid }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: chart.text }} axisLine={{ stroke: chart.grid }} tickLine={{ stroke: chart.grid }} />
          <Tooltip {...tooltipProps} />
          <Legend wrapperStyle={{ color: chart.text }} />
          <Bar dataKey="weekly" fill={chart.green} radius={[4, 4, 0, 0]} />
          <Bar dataKey="monthly" fill={chart.gold} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function SimpleBarChart({
  title,
  data,
  xKey,
  yKey
}: {
  title: string;
  data: ChartDatum[];
  xKey: string;
  yKey: string;
}) {
  return (
    <Card className="h-[300px] sm:h-[320px]">
      <SectionTitle title={title} />
      <ResponsiveContainer width="100%" height="82%">
        <BarChart data={data}>
          <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: chart.text }} axisLine={{ stroke: chart.grid }} tickLine={{ stroke: chart.grid }} />
          <YAxis tick={{ fontSize: 12, fill: chart.text }} axisLine={{ stroke: chart.grid }} tickLine={{ stroke: chart.grid }} />
          <Tooltip {...tooltipProps} />
          <Bar dataKey={yKey} radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function AreaTrendChart({
  title,
  data,
  keys
}: {
  title: string;
  data: ChartDatum[];
  keys: string[];
}) {
  return (
    <Card className="h-[300px] sm:h-[320px]">
      <SectionTitle title={title} />
      <ResponsiveContainer width="100%" height="82%">
        <AreaChart data={data}>
          <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: chart.text }} axisLine={{ stroke: chart.grid }} tickLine={{ stroke: chart.grid }} />
          <YAxis tick={{ fontSize: 12, fill: chart.text }} axisLine={{ stroke: chart.grid }} tickLine={{ stroke: chart.grid }} />
          <Tooltip {...tooltipProps} />
          <Legend wrapperStyle={{ color: chart.text }} />
          {keys.map((key, index) => (
            <Area key={key} type="monotone" dataKey={key} stroke={colors[index % colors.length]} fill={colors[index % colors.length]} fillOpacity={0.18} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
