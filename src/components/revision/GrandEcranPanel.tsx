"use client";

import { useState } from "react";
import { BookOpen, AlignLeft, Tag, Lightbulb, ChevronDown } from "lucide-react";
import type { Course, GlossaryTerm } from "@/types";

interface Props {
  course: Course;
}

type Tab = "summary" | "glossary" | "concepts";

export default function GrandEcranPanel({ course }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  if (!course.summary && !course.glossary && !course.key_concepts) {
    return (
      <div className="card border-warn-700 bg-surface-900">
        <p className="text-warn-400 text-sm">
          ⚠️ L&apos;analyse IA n&apos;a pas encore été générée pour ce cours. Reviens dans quelques instants.
        </p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "summary", label: "Résumé", icon: AlignLeft },
    {
      id: "glossary",
      label: "Glossaire",
      icon: Tag,
      count: Array.isArray(course.glossary) ? course.glossary.length : 0,
    },
    {
      id: "concepts",
      label: "Concepts clés",
      icon: Lightbulb,
      count: Array.isArray(course.key_concepts) ? course.key_concepts.length : 0,
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-brand-400" />
        <h2 className="font-display text-lg font-semibold text-slate-200">
          Mode Grand Écran
        </h2>
        <span className="badge-brand">Passif enrichi</span>
      </div>

      <div className="card p-0 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-surface-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-surface-700 text-slate-400 text-xs rounded-full px-1.5 py-0.5">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {/* Summary — rendered as HTML with inline styles instead of prose plugin */}
          {activeTab === "summary" && (
            <div
              className="summary-content text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: course.summary ?? "<p>Résumé non disponible.</p>",
              }}
            />
          )}

          {activeTab === "glossary" && (
            <div className="space-y-2">
              {Array.isArray(course.glossary) && course.glossary.length > 0 ? (
                (course.glossary as GlossaryTerm[]).map((item) => (
                  <div
                    key={item.term}
                    className="border border-surface-700 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedTerm(expandedTerm === item.term ? null : item.term)
                      }
                      className="w-full flex items-center justify-between p-3.5 text-left hover:bg-surface-800 transition-colors"
                    >
                      <span className="font-medium text-brand-300 text-sm">{item.term}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 transition-transform ${
                          expandedTerm === item.term ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {expandedTerm === item.term && (
                      <div className="px-4 pb-4 pt-1 border-t border-surface-700">
                        <p className="text-sm text-slate-300">{item.definition}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">Aucun terme de glossaire disponible.</p>
              )}
            </div>
          )}

          {activeTab === "concepts" && (
            <div className="flex flex-wrap gap-2">
              {Array.isArray(course.key_concepts) && course.key_concepts.length > 0 ? (
                (course.key_concepts as string[]).map((concept, i) => (
                  <div
                    key={i}
                    className="px-3 py-1.5 rounded-xl border border-brand-700 text-brand-300 text-sm font-medium"
                    style={{ backgroundColor: "rgb(99 102 241 / 0.15)" }}
                  >
                    {concept}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">Aucun concept clé disponible.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
