import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Minus, X, Save, Trash2, Calculator, ChevronDown } from "lucide-react";
import { store, epley1RM, type Exercise, type Session, type Lift, type SetEntry } from "@/lib/store";

export const Route = createFileRoute("/entrenar")({
  head: () => ({
    meta: [
      { title: "Entrenar — PWR.TRACKER" },
      { name: "description", content: "Registra tu sesión: SBD primero, luego accesorios. Con plate calculator y 1RM estimado." },
    ],
  }),
  component: EntrenarPage,
});

const LIFTS: Lift[] = ["Squat", "Bench Press", "Deadlift"];
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATE_COLORS: Record<number, string> = {
  25: "oklch(0.65 0.22 25)",
  20: "oklch(0.55 0.22 255)",
  15: "oklch(0.78 0.18 75)",
  10: "oklch(0.6 0.18 150)",
  5: "oklch(0.85 0.005 250)",
  2.5: "oklch(0.5 0.02 250)",
  1.25: "oklch(0.35 0.02 250)",
};

function calcPlates(target: number, bar = 20): { plate: number; count: number }[] {
  let perSide = (target - bar) / 2;
  if (perSide <= 0) return [];
  const out: { plate: number; count: number }[] = [];
  for (const p of PLATES) {
    const c = Math.floor(perSide / p);
    if (c > 0) {
      out.push({ plate: p, count: c });
      perSide -= c * p;
    }
  }
  return out;
}

function EntrenarPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session>(() => store.newSession());
  const [activeExId, setActiveExId] = useState<string>(() => session.exercises[0]?.id ?? "");
  const [activeSetIdx, setActiveSetIdx] = useState(0);

  const activeEx = session.exercises.find((e) => e.id === activeExId) ?? session.exercises[0];
  const activeSet = activeEx?.sets[activeSetIdx] ?? activeEx?.sets[0];
  const target = activeSet?.weight ?? 0;
  const plates = useMemo(() => calcPlates(target), [target]);
  const loaded = 20 + plates.reduce((acc, p) => acc + p.plate * p.count * 2, 0);

  function patchEx(id: string, fn: (e: Exercise) => Exercise) {
    setSession((s) => ({ ...s, exercises: s.exercises.map((e) => (e.id === id ? fn(e) : e)) }));
  }

  function addEx(kind: "SBD" | "Accessory") {
    const ex: Exercise = {
      id: store.uid(),
      kind,
      name: kind === "SBD" ? "Squat" : "Accesorio",
      sets: [{ weight: kind === "SBD" ? 60 : 20, reps: kind === "SBD" ? 5 : 10 }],
    };
    setSession((s) => ({ ...s, exercises: [...s.exercises, ex] }));
    setActiveExId(ex.id);
    setActiveSetIdx(0);
  }

  function removeEx(id: string) {
    setSession((s) => ({ ...s, exercises: s.exercises.filter((e) => e.id !== id) }));
  }

  function save() {
    const valid = session.exercises.filter((e) => e.sets.some((st) => st.weight > 0 && st.reps > 0));
    if (!valid.length) return;
    store.add({ ...session, exercises: valid });
    navigate({ to: "/historial" });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl sm:text-6xl">
            ENTRENAR<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            SBD primero, luego accesorios. Tu sesión se guarda localmente.
          </p>
        </div>
        <button
          onClick={save}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-105 active:scale-95"
        >
          <Save className="h-4 w-4" />
          Guardar
        </button>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 grid sm:grid-cols-2 gap-5">
        <div>
          <label className="text-[10px] font-mono-tight uppercase tracking-[0.2em] text-muted-foreground">Fecha</label>
          <input
            type="date"
            value={session.date}
            onChange={(e) => setSession({ ...session, date: e.target.value })}
            className="mt-2 w-full rounded-lg bg-input border border-border px-3 py-2.5 font-mono-tight text-base outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono-tight uppercase tracking-[0.2em] text-muted-foreground">Notas</label>
          <textarea
            value={session.notes ?? ""}
            onChange={(e) => setSession({ ...session, notes: e.target.value })}
            placeholder="Sensaciones, RPE, etc."
            rows={2}
            className="mt-2 w-full rounded-lg bg-input border border-border px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
          />
        </div>
      </section>

      <section className="space-y-3">
        {session.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            ex={ex}
            isActive={ex.id === activeExId}
            onSelectSet={(idx) => { setActiveExId(ex.id); setActiveSetIdx(idx); }}
            onPatch={(fn) => patchEx(ex.id, fn)}
            onRemove={() => removeEx(ex.id)}
          />
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button onClick={() => addEx("SBD")} className="rounded-xl border border-dashed border-border bg-card/40 hover:bg-card/70 transition-colors py-4 flex items-center justify-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> Añadir SBD
        </button>
        <button onClick={() => addEx("Accessory")} className="rounded-xl border border-dashed border-border bg-card/40 hover:bg-card/70 transition-colors py-4 flex items-center justify-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> Añadir Accesorio
        </button>
      </section>

      {activeSet && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" /> PLATE CALCULATOR
            </h3>
            <span className="text-[10px] font-mono-tight text-muted-foreground uppercase tracking-widest">Bar 20kg</span>
          </div>
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-1">
              {[...plates].reverse().map((p, i) =>
                Array.from({ length: p.count }).map((_, j) => (
                  <div
                    key={`l-${i}-${j}`}
                    className="rounded-sm"
                    style={{
                      background: PLATE_COLORS[p.plate],
                      width: 8 + p.plate * 0.6,
                      height: 30 + p.plate * 2,
                      boxShadow: "0 2px 8px oklch(0 0 0 / 0.3)",
                    }}
                    title={`${p.plate}kg`}
                  />
                ))
              )}
              <div className="h-1 w-8 bg-muted-foreground/40 rounded" />
              <div className="h-2 w-32 bg-gradient-to-r from-muted-foreground/30 via-foreground/80 to-muted-foreground/30 rounded" />
              <div className="h-1 w-8 bg-muted-foreground/40 rounded" />
              {plates.map((p, i) =>
                Array.from({ length: p.count }).map((_, j) => (
                  <div
                    key={`r-${i}-${j}`}
                    className="rounded-sm"
                    style={{
                      background: PLATE_COLORS[p.plate],
                      width: 8 + p.plate * 0.6,
                      height: 30 + p.plate * 2,
                      boxShadow: "0 2px 8px oklch(0 0 0 / 0.3)",
                    }}
                    title={`${p.plate}kg`}
                  />
                ))
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {plates.length === 0 ? (
              <span className="text-xs text-muted-foreground">Solo barra (20kg)</span>
            ) : (
              plates.map((p) => (
                <span
                  key={p.plate}
                  className="text-[11px] font-mono-tight px-2 py-1 rounded-md border"
                  style={{ borderColor: PLATE_COLORS[p.plate], color: PLATE_COLORS[p.plate] }}
                >
                  {p.plate}kg ×{p.count}/lado
                </span>
              ))
            )}
          </div>
          <div className="grid grid-cols-2 pt-4 border-t border-border">
            <div>
              <div className="text-[10px] font-mono-tight uppercase tracking-[0.18em] text-muted-foreground">Loaded</div>
              <div className="font-display text-2xl mt-1">{loaded}<span className="text-sm text-muted-foreground"> kg</span></div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono-tight uppercase tracking-[0.18em] text-muted-foreground">Target</div>
              <div className={`font-display text-2xl mt-1 ${loaded === target ? "text-success" : "text-warning"}`}>
                {target}<span className="text-sm text-muted-foreground"> kg</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ExerciseCard({
  ex,
  isActive,
  onSelectSet,
  onPatch,
  onRemove,
}: {
  ex: Exercise;
  isActive: boolean;
  onSelectSet: (idx: number) => void;
  onPatch: (fn: (e: Exercise) => Exercise) => void;
  onRemove: () => void;
}) {
  const top = ex.sets.reduce<SetEntry | null>((a, b) => (!a || b.weight > a.weight ? b : a), null);
  const oneRm = top ? epley1RM(top.weight, top.reps) : 0;

  function bumpSet(idx: number, key: "weight" | "reps", delta: number) {
    onPatch((e) => ({
      ...e,
      sets: e.sets.map((s, i) => (i === idx ? { ...s, [key]: Math.max(0, s[key] + delta) } : s)),
    }));
  }
  function setVal(idx: number, key: "weight" | "reps", v: number) {
    onPatch((e) => ({ ...e, sets: e.sets.map((s, i) => (i === idx ? { ...s, [key]: v } : s)) }));
  }

  return (
    <div className={`rounded-2xl border bg-card p-4 transition-all ${isActive ? "border-primary/50 shadow-[var(--shadow-glow)]" : "border-border"}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-mono-tight px-2 py-1 rounded-md uppercase tracking-widest ${ex.kind === "SBD" ? "bg-primary/15 text-primary border border-primary/30" : "bg-accent/15 text-accent border border-accent/30"}`}>
          {ex.kind}
        </span>
        {ex.kind === "SBD" ? (
          <div className="relative flex-1">
            <select
              value={ex.name}
              onChange={(e) => onPatch((p) => ({ ...p, name: e.target.value }))}
              className="w-full appearance-none rounded-lg bg-input border border-border px-3 py-2 pr-8 text-sm outline-none focus:border-primary"
            >
              {LIFTS.map((l) => <option key={l}>{l}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        ) : (
          <input
            value={ex.name}
            onChange={(e) => onPatch((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nombre del accesorio"
            className="flex-1 rounded-lg bg-input border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        )}
        <button onClick={onRemove} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        {ex.sets.map((s, idx) => (
          <div
            key={idx}
            onClick={() => onSelectSet(idx)}
            className="grid grid-cols-[24px_1fr_1fr_auto] items-center gap-2 rounded-lg bg-background/40 p-2 cursor-pointer"
          >
            <span className="text-xs font-mono-tight text-muted-foreground text-center">{idx + 1}</span>
            <NumField value={s.weight} unit="kg" onBump={(d) => bumpSet(idx, "weight", d)} onSet={(v) => setVal(idx, "weight", v)} step={2.5} />
            <NumField value={s.reps} unit="reps" onBump={(d) => bumpSet(idx, "reps", d)} onSet={(v) => setVal(idx, "reps", v)} step={1} />
            <button
              onClick={(e) => { e.stopPropagation(); onPatch((p) => ({ ...p, sets: p.sets.filter((_, i) => i !== idx) })); }}
              className="p-1.5 text-muted-foreground hover:text-destructive"
              aria-label="remove set"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <button
          onClick={() => onPatch((e) => {
            const last = e.sets[e.sets.length - 1] ?? { weight: 60, reps: 5 };
            return { ...e, sets: [...e.sets, { ...last }] };
          })}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80"
        >
          <Plus className="h-3.5 w-3.5" /> Set
        </button>
        {top && (
          <div className="text-[11px] font-mono-tight text-muted-foreground">
            Top <span className="text-foreground">{top.weight}×{top.reps}</span> · 1RM est. <span className="text-foreground">{oneRm.toFixed(1)}kg</span>
          </div>
        )}
      </div>
    </div>
  );
}

function NumField({ value, unit, step, onBump, onSet }: { value: number; unit: string; step: number; onBump: (d: number) => void; onSet: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-input border border-border">
      <button onClick={(e) => { e.stopPropagation(); onBump(-step); }} className="p-1.5 text-muted-foreground hover:text-foreground">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        value={value}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onSet(parseFloat(e.target.value) || 0)}
        step={step}
        className="w-full bg-transparent text-center font-mono-tight text-base font-semibold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-[10px] font-mono-tight text-muted-foreground pr-1.5">{unit}</span>
      <button onClick={(e) => { e.stopPropagation(); onBump(step); }} className="p-1.5 text-muted-foreground hover:text-foreground">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
