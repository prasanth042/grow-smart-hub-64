import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { recommendCrops } from "@/lib/crop-advice.functions";
import { ArrowLeft, Sparkles, Sprout } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/crop-planning")({
  head: () => ({
    meta: [
      { title: "Crop Planning — Smart Farmer Assistant" },
      { name: "description", content: "AI-powered crop recommendations for your soil, water source, and season." },
    ],
  }),
  component: CropPlanning,
});

type Land = { id: string; name: string; area_acres: number; soil_type: string | null; water_source: string | null; location: string | null };

function seasonForNow(): "kharif" | "rabi" | "zaid" {
  const m = new Date().getMonth() + 1;
  if (m >= 6 && m <= 10) return "kharif";
  if (m >= 11 || m <= 3) return "rabi";
  return "zaid";
}

function CropPlanning() {
  const { t, lang } = useLang();
  const [landId, setLandId] = useState<string>("");
  const [season, setSeason] = useState<"kharif" | "rabi" | "zaid">(seasonForNow());
  const call = useServerFn(recommendCrops);

  const { data: lands } = useQuery({
    queryKey: ["lands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lands").select("id,name,area_acres,soil_type,water_source,location").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Land[];
    },
  });

  const mut = useMutation({
    mutationFn: async () => {
      const land = lands?.find((l) => l.id === landId);
      if (!land) throw new Error(t("selectLand"));
      return await call({
        data: {
          soil_type: land.soil_type,
          water_source: land.water_source,
          area_acres: Number(land.area_acres),
          location: land.location,
          season,
          language: lang,
        },
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <div className="min-h-screen">
      <AppHeader authed />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> {t("dashboard")}</Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sprout className="h-6 w-6 text-primary" /> {t("cropPlanning")}</h1>

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
                <Label>{t("season")}</Label>
                <Select value={season} onValueChange={(v) => setSeason(v as typeof season)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kharif">{t("kharif")}</SelectItem>
                    <SelectItem value="rabi">{t("rabi")}</SelectItem>
                    <SelectItem value="zaid">{t("zaid")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button onClick={() => mut.mutate()} disabled={!landId || mut.isPending} className="w-full sm:w-auto">
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
              <p className="text-sm">{mut.data.summary}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {mut.data.crops.map((c, i) => (
                <div key={i} className="card-tile">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-lg">{c.name}</div>
                    <SuitBadge s={c.suitability} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{c.why}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <Stat label={t("duration")} value={`${c.duration_days} ${t("days")}`} />
                    <Stat label={t("expectedYield")} value={c.expected_yield} />
                    <Stat label={t("waterNeed")} value={c.water_need} />
                  </div>
                  {c.tips.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium mb-1">{t("tips")}</div>
                      <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                        {c.tips.map((tip, j) => <li key={j}>{tip}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border/60 px-2 py-1.5">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function SuitBadge({ s }: { s: "excellent" | "good" | "fair" }) {
  const cls = s === "excellent" ? "bg-primary/15 text-primary" : s === "good" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground";
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{s}</span>;
}
