"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import type { StudyDay, StudySession } from "@/types";
import { clsx } from "clsx";

interface Props {
  days: StudyDay[];
  generatedAt: string;
}

const PRIORITY_COLORS: Record<StudySession["priority"], string> = {
  high: "bg-danger-900/30 border-danger-700/40 text-danger-300",
  medium: "bg-brand-900/30 border-brand-700/40 text-brand-300",
  low: "bg-surface-800 border-surface-700 text-slate-400",
};

const PRIORITY_DOTS: Record<StudySession["priority"], string> = {
  high: "bg-danger-400",
  medium: "bg-brand-400",
  low: "bg-slate-500",
};

export default function PlannerCalendar({ days, generatedAt }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);

  // Group days by week
  const weeks: StudyDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const currentWeek = weeks[weekOffset] ?? [];
  const totalWeeks = weeks.length;
  const activeDays = days.filter((d) => !d.isRestDay);
  const totalHours = activeDays.reduce(
    (sum, d) => sum + d.sessions.reduce((s2, sess) => s2 + sess.duration, 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-brand-400" />
          <div>
            <p className="font-display font-semibold text-slate-100">
              Planning de révision
            </p>
            <p className="text-xs text-slate-500">
              Généré le {format(parseISO(generatedAt), "dd MMM yyyy", { locale: fr })} •{" "}
              {days.length} jours • {Math.round(totalHours / 60)}h au total
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          {(["high", "medium", "low"] as const).map((p) => (
            <span key={p} className="flex items-center gap-1.5 text-slate-400">
              <span className={clsx("w-2 h-2 rounded-full", PRIORITY_DOTS[p])} />
              {p === "high" ? "Prioritaire" : p === "medium" ? "Normal" : "Léger"}
            </span>
          ))}
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
          disabled={weekOffset === 0}
          className="btn-ghost p-2"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="flex-1 text-center text-sm font-medium text-slate-300">
          Semaine {weekOffset + 1} / {totalWeeks}
        </span>
        <button
          onClick={() => setWeekOffset((w) => Math.min(totalWeeks - 1, w + 1))}
          disabled={weekOffset >= totalWeeks - 1}
          className="btn-ghost p-2"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day cards */}
      <div className="grid grid-cols-1 gap-3">
        {currentWeek.map((day) => {
          const date = parseISO(day.date);
          const dayLabel = format(date, "EEEE dd MMMM", { locale: fr });
          const totalMins = day.sessions.reduce((s, sess) => s + sess.duration, 0);

          return (
            <div
              key={day.date}
              className={clsx(
                "card",
                day.isRestDay && "opacity-60 border-dashed border-surface-700"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-display font-semibold text-slate-200 capitalize">
                  {dayLabel}
                </p>
                {day.isRestDay ? (
                  <span className="badge bg-surface-700 text-slate-400 border-surface-600">
                    Repos 😴
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {Math.floor(totalMins / 60)}h{totalMins % 60 > 0 ? `${totalMins % 60}` : ""}
                  </span>
                )}
              </div>

              {!day.isRestDay && day.sessions.length > 0 && (
                <div className="space-y-2">
                  {day.sessions.map((session, i) => (
                    <div
                      key={i}
                      className={clsx(
                        "flex items-start gap-3 p-2.5 rounded-xl border text-sm",
                        PRIORITY_COLORS[session.priority]
                      )}
                    >
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", PRIORITY_DOTS[session.priority])} />
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{session.subject}</p>
                        {session.topics.length > 0 && (
                          <p className="text-xs opacity-70 mt-0.5 truncate">
                            {session.topics.join(" • ")}
                          </p>
                        )}
                      </div>
                      <span className="flex-shrink-0 text-xs opacity-70 font-mono">
                        {session.duration}min
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {currentWeek.length === 0 && (
          <div className="card text-center py-8 text-slate-400 text-sm">
            Pas de données pour cette semaine.
          </div>
        )}
      </div>
    </div>
  );
}
