import { createClient } from "@/lib/supabase/server";
import PlannerForm from "@/components/planner/PlannerForm";
import PlannerCalendar from "@/components/planner/PlannerCalendar";

export default async function PlannerPage() {
  const supabase = createClient();
  const { data: plan } = await supabase
    .from("study_plans")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="space-y-8 pb-20 md:pb-0 animate-fade-in">
      <div>
        <h1 className="section-title">📅 Planificateur d&apos;étude</h1>
        <p className="text-slate-400 text-sm mt-1">
          L&apos;IA génère un calendrier personnalisé basé sur tes examens et tes disponibilités.
        </p>
      </div>

      <div className="grid xl:grid-cols-5 gap-6">
        {/* Form – left col */}
        <div className="xl:col-span-2">
          <PlannerForm existingPlan={plan} />
        </div>

        {/* Calendar – right col */}
        <div className="xl:col-span-3">
          {plan?.plan_data ? (
            <PlannerCalendar days={plan.plan_data} generatedAt={plan.generated_at} />
          ) : (
            <div className="card flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">📅</div>
              <p className="font-display font-semibold text-slate-200 mb-2">
                Aucun planning généré
              </p>
              <p className="text-sm text-slate-400 max-w-xs">
                Remplis le formulaire et laisse l&apos;IA créer ton planning de révision optimal.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
