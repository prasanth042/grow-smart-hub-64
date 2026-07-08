import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { useLang, type DictKey } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fertilizerAdvice } from "@/lib/fertilizer-advice.functions";
import { ArrowLeft, FlaskConical, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/fertilizer")({
  head: () => ({
    meta: [
      { title: "Fertilizer Advisor — Smart Farmer Assistant" },
      { name: "description", content: "AI-tailored NPK plan and organic amendments for your crop and stage." },
    ],
  }),
  component: FertilizerPage,
});

type Land = { id: string; name: string; area_acres: number; soil_type: string | null };
type Stage = "seedling" | "vegetative" | "flowering" | "fruiting" | "maturity";

function FertilizerPage() {
  const { t, lang } = useLang();
  const [landId, setLandId] = useState("");
  const [crop, setCrop] = useState("");
  const [stage, setStage] = useState<Stage>("vegetative");
  const call = useServerFn(fertilizerAdvice);

  const { data: lands } = useQuery({
    queryKey: ["lands"],
    queryFn: async () => {
      const { data } = await supabase.from("lands").select("id,name,area_acres,soil_type");
      return (data ?? []) as Land[];
    },
  });

  const land = lands?.find((l) => l.id === landId);

  const mut = useMutation({
    mutationFn: async () => {
      if (!land) throw new Error(t("selectLand"));
      if (!crop) throw new Error("Please enter a crop");
      return await call({
        data: {
          crop,
          soil_type: land.soil_type,
          area_acres: Number(land.area_acres),
          stage,
          language: lang,
        },
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const stages: Stage[] = ["seedling", "vegetative", "flowering", "fruiting", "maturity"];

  return (
    <div className="min-h-screen">
      <AppHeader authed />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> {t("dashboard")}</Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-primary" /> {t("fertilizer")}
        </h1>

        <div className="mt-6 card-tile">
          {(lands?.length ?? 0) === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              {t("needLandFirst")} <Link to="/land" className="text-primary underline ml-1">{t("addLand")}</Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("selectLand")}</Label>
                <Select value={landId} onValueChange={setLandId}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {lands!.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name} · {l.area_acres} {t("acres")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("cropType")}</Label>
                <Input placeholder="e.g. rice, tomato" value={crop} onChange={(e) => setCrop(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("growthStage")}</Label>
                <Select value={stage} onValueChange={(v) => setStage(v as Stage)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => <SelectItem key={s} value={s}>{t(s as DictKey)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button onClick={() => mut.mutate()} disabled={!landId || !crop || mut.isPending} className="w-full sm:w-auto">
                  <Sparkles className="h-4 w-4 mr-1" />
                  {mut.isPending ? t("generating") : t("recommend")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {mut.data && (
          <div className="mt-6 space-y-4">
            <div className="card-tile bg-primary/5 border-primary/20">
              <div className="font-medium mb-2">{t("npkTotal")} ({land?.area_acres} {t("acres")})</div>
              <div className="grid grid-cols-3 gap-3">
                <NpkStat label="N" value={`${mut.data.npk.nitrogen_kg} kg`} />
                <NpkStat label="P" value={`${mut.data.npk.phosphorus_kg} kg`} />
                <NpkStat label="K" value={`${mut.data.npk.potassium_kg} kg`} />
              </div>
            </div>

            <div className="card-tile">
              <div className="font-medium mb-2">{t("applicationPlan")}</div>
              <div className="space-y-3">
                {mut.data.primary.map((p, i) => (
                  <div key={i} className="border-l-2 border-primary/40 pl-3">
                    <div className="font-medium">{p.name} <span className="text-sm text-muted-foreground">· {p.quantity}</span></div>
                    <div className="text-sm text-muted-foreground">{t("when")}: {p.when}</div>
                    <div className="text-sm text-muted-foreground">{t("how")}: {p.how}</div>
                  </div>
                ))}
              </div>
            </div>

            <ListCard title={t("organicAmendments")} items={mut.data.organic} accent />
            <ListCard title={t("micronutrients")} items={mut.data.micronutrient_tips} />
            {mut.data.warnings.length > 0 && (
              <div className="card-tile bg-destructive/5 border-destructive/20">
                <div className="font-medium mb-2 text-destructive">{t("warnings")}</div>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {mut.data.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function NpkStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card border border-border px-3 py-2 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold text-primary">{value}</div>
    </div>
  );
}

function ListCard({ title, items, accent }: { title: string; items: string[]; accent?: boolean }) {
  if (!items?.length) return null;
  return (
    <div className={`card-tile ${accent ? "bg-primary/5 border-primary/20" : ""}`}>
      <div className="font-medium mb-2">{title}</div>
      <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}
