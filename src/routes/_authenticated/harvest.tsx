import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { harvestPredict } from "@/lib/harvest-predict.functions";
import { ArrowLeft, Wheat, Sparkles, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/harvest")({
  head: () => ({
    meta: [
      { title: "Harvest Prediction — Smart Farmer Assistant" },
      { name: "description", content: "Predict harvest date, yield, and next actions based on your sowing plan." },
    ],
  }),
  component: HarvestPage,
});

type Land = { id: string; name: string; area_acres: number; soil_type: string | null; water_source: string | null; location: string | null };

function HarvestPage() {
  const { t, lang } = useLang();
  const [landId, setLandId] = useState("");
  const [crop, setCrop] = useState("");
  const [sowing, setSowing] = useState(new Date().toISOString().slice(0, 10));
  const call = useServerFn(harvestPredict);

  const { data: lands } = useQuery({
    queryKey: ["lands"],
    queryFn: async () => {
      const { data } = await supabase.from("lands").select("id,name,area_acres,soil_type,water_source,location");
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
          sowing_date: sowing,
          area_acres: Number(land.area_acres),
          soil_type: land.soil_type,
          water_source: land.water_source,
          location: land.location,
          language: lang,
        },
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <div className="min-h-screen">
      <AppHeader authed />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> {t("dashboard")}</Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wheat className="h-6 w-6 text-primary" /> {t("harvest")}
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
                <Input placeholder="e.g. rice, cotton" value={crop} onChange={(e) => setCrop(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("sowingDate")}</Label>
                <Input type="date" value={sowing} onChange={(e) => setSowing(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={() => mut.mutate()} disabled={!landId || !crop || mut.isPending} className="w-full sm:w-auto">
                  <Sparkles className="h-4 w-4 mr-1" />
                  {mut.isPending ? t("generating") : t("predict")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {mut.data && (
          <div className="mt-6 space-y-4">
            <div className="card-tile bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs uppercase text-muted-foreground">{t("harvestWindow")}</div>
                  <div className="text-lg font-semibold">
                    {mut.data.harvest_window_start} → {mut.data.harvest_window_end}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {mut.data.days_to_harvest} {t("daysToHarvest")} · {t("currentStage")}: {mut.data.current_stage}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="card-tile">
                <div className="text-xs text-muted-foreground">{t("expectedYield")} / {t("acres")}</div>
                <div className="text-lg font-semibold text-primary">{mut.data.expected_yield_per_acre}</div>
              </div>
              <div className="card-tile">
                <div className="text-xs text-muted-foreground">{t("totalYield")}</div>
                <div className="text-lg font-semibold text-primary">{mut.data.expected_yield_total}</div>
              </div>
            </div>

            <ListCard title={t("nextActions")} items={mut.data.next_actions} accent />
            <ListCard title={t("harvestTips")} items={mut.data.harvest_tips} />
            {mut.data.risk_factors.length > 0 && (
              <div className="card-tile bg-destructive/5 border-destructive/20">
                <div className="font-medium mb-2 text-destructive">{t("riskFactors")}</div>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {mut.data.risk_factors.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
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
