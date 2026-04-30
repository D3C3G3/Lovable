import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Flame, TrendingUp, Trophy } from "lucide-react";
import { useSessions, type Lift, liftBest, epley1RM, sessionVolume } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — PWR.TRACKER" },
      { name: "description", content: "Visualiza tu progreso SBD: top sets, 1RM estimado y volumen total." },
    ],
  }),
  component: Dashboard,
});

const LIFTS: Lift[] = ["Squat", "Bench Press", "Deadlift"];
const COLORS: Record<Lift, string> = {
  Squat: "var(--squat)",
  "Bench Press": "var(--bench)",
  Deadlift: "var(--deadlift)",
};

function StatCard({ lift, weight, reps, oneRm, delta }: { lift: Lift; weight: number; reps: number; oneRm: number; delta: number }) {
  const color = COLORS[lift];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div
        className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-20 blur-2xl"
        style={{ background: color }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[10px] font-mono-tight uppercase tracking-[0.2em] text-muted-foreground">
            {lift}
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-display text-4xl">{weight}</span>
            <span className="text-sm text-muted-foreground font-mono-tight">kg</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground font-mono-tight">
            {reps} reps · 1RM <span className="text-foreground">{oneRm.toFixed(1)}kg</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Flame className="h-4 w-4" style={{ color }} />
          {delta !== 0 && (
            <span className={`text-[10px] font-mono-tight px-2 py-0.5 rounded-md border ${delta > 0 ? "text-success border-success/30 bg-success/10" : "text-destructive border-destructive/30 bg-destructive/10"}`}>
              {delta > 0 ? "+" : ""}{delta.toFixed(1)}kg
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const sessions = useSessions();

  const sbdSessions = useMemo(
    () => sessions.filter((s) => s.exercises.some((e) => e.kind === "SBD")),
    [sessions],
  );

  const last = sbdSessions[sbdSessions.length - 1];
  const prev = sbdSessions[sbdSessions.length - 2];

  const chartData = useMemo(() => {
    return sbdSessions.map((s) => {
      const row: Record<string, number | string> = { date: s.date };
      for (const lift of LIFTS) {
        const t = liftBest(s, lift);
        if (t) row[lift] = t.weight;
      }
      return row;
    });
  }, [sbdSessions]);

  const totalVolume = useMemo(
    () => sessions.reduce((acc, s) => acc + sessionVolume(s), 0),
    [sessions],
  );
  const totalSessions = sessions.length;
  const allTimePR = useMemo(() => {
    const prs: Record<Lift, number> = { Squat: 0, "Bench Press": 0, Deadlift: 0 };
    for (const s of sbdSessions) {
      for (const lift of LIFTS) {
        const t = liftBest(s, lift);
        if (t && t.weight > prs[lift]) prs[lift] = t.weight;
      }
    }
    return prs;
  }, [sbdSessions]);

  if (!last) return <EmptyState />;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-5xl sm:text-6xl">
          PROGRESO<span className="text-primary">.</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          Filtro de rendimiento: solo sesiones SBD. Mostrando {sbdSessions.length} sesiones de tu progresión.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LIFTS.map((lift) => {
          const cur = liftBest(last, lift);
          const prevBest = prev ? liftBest(prev, lift) : null;
          if (!cur) return null;
          return (
            <StatCard
              key={lift}
              lift={lift}
              weight={cur.weight}
              reps={cur.reps}
              oneRm={epley1RM(cur.weight, cur.reps)}
              delta={prevBest ? cur.weight - prevBest.weight : 0}
            />
          );
        })}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-mono-tight uppercase tracking-[0.2em] text-muted-foreground">
              Progresión SBD
            </div>
            <h2 className="font-display text-xl mt-1 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              TOP SET / KG
            </h2>
          </div>
          <div className="hidden sm:flex gap-3 text-[11px] font-mono-tight text-muted-foreground">
            {LIFTS.map((l) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[l] }} />
                {l}
              </span>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="var(--grid-line)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "ui-monospace" }}
                tickFormatter={(d) => new Date(d).toLocaleDateString("es", { day: "2-digit", month: "short" })}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "ui-monospace" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--tooltip-bg)",
                  border: "1px solid var(--tooltip-border)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "var(--foreground)",
                }}
                labelFormatter={(d) => new Date(d as string).toLocaleDateString("es", { weekday: "short", day: "2-digit", month: "short" })}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {LIFTS.map((l) => (
                <Line
                  key={l}
                  type="monotone"
                  dataKey={l}
                  stroke={COLORS[l]}
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 0, fill: COLORS[l] }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Sesiones" value={totalSessions.toString()} />
        <MiniStat label="Volumen total" value={`${(totalVolume / 1000).toFixed(1)}t`} />
        <MiniStat label="PR Squat" value={`${allTimePR.Squat}kg`} icon={<Trophy className="h-3.5 w-3.5" style={{ color: COLORS.Squat }} />} />
        <MiniStat label="PR Deadlift" value={`${allTimePR.Deadlift}kg`} icon={<Trophy className="h-3.5 w-3.5" style={{ color: COLORS.Deadlift }} />} />
      </section>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-mono-tight uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <h1 className="font-display text-4xl">Aún no hay sesiones</h1>
      <p className="mt-2 text-muted-foreground">Empieza añadiendo tu primera sesión.</p>
    </div>
  );
}
