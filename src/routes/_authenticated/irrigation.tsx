import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { useLang, type DictKey } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Droplets } from "lucide-react";

export const Route = createFileRoute("/_authenticated/irrigation")({
  head: () => ({
    meta: [
      { title: "Irrigation Planner — Smart Farmer Assistant" },
      { name: "description", content: "Estimate weekly water needs and irrigation schedule for your crops." },
    ],
  }),
  component: IrrigationPage,
});

type Land = { id: string; name: string; area_acres: number; soil_type: string | null; water_source: string | null };

// Rough crop water need per week (mm) at mid-season, adjusted by stage.
const CROP_WATER: Record<string, number> = {
  rice: 60, wheat: 30, maize: 35, cotton: 45, sugarcane: 55,
  groundnut: 30, tomato: 40, chilli: 35, onion: 30, banana: 55,
  brinjal: 35, other: 35,
};
const STAGE_FACTOR: Record<string, number> = {
  seedling: 0.4, vegetative: 0.8, flowering: 1.15, fruiting: 1.0, maturity: 0.6,
};
const SOIL_FACTOR: Record<string, number> = {
  sandy: 1.2, loamy: 1.0, silty: 0.95, clay: 0.8, black: 0.85, red: 1.05, alluvial: 0.95, peaty: 0.9, chalky: 1.1,
};

function IrrigationPage() {
  const { t } = useLang();
  const [landId, setLandId] = useState("");
  const [crop, setCrop] = useState("rice");
  const [stage, setStage] = useState<keyof typeof STAGE_FACTOR>("vegetative");
  const [efficiency, setEfficiency] = useState(70); // % (drip=85, sprinkler=75, flood=55)

  const { data: lands } = useQuery({
    queryKey: ["lands"],
    queryFn: async () => {
      const { data } = await supabase.from("lands").select("id,name,area_acres,soil_type,water_source");
      return (data ?? []) as Land[];
    },
  });

  const land = lands?.find((l) => l.id === landId);
  const base = CROP_WATER[crop] ?? 35;
  const soilF = land?.soil_type ? SOIL_FACTOR[land.soil_type] ?? 1 : 1;
  const stageF = STAGE_FACTOR[stage];
  const mmPerWeek = base * stageF * soilF;
  const acres = land?.area_acres ?? 0;
  // 1 mm on 1 acre ≈ 4046.86 liters; adjust for irrigation efficiency
  const litersPerWeek = acres > 0 ? (mmPerWeek * 4046.86 * acres) / (efficiency / 100) : 0;
  const freqDays = mmPerWeek > 45 ? 2 : mmPerWeek > 25 ? 3 : mmPerWeek > 10 ? 5 : 7;

  const stages: (keyof typeof STAGE_FACTOR)[] = ["seedling", "vegetative", "flowering", "fruiting", "maturity"];

  return (
    <div className="min-h-screen">
      <AppHeader authed />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> {t("dashboard")}</Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Droplets className="h-6 w-6 text-primary" /> {t("irrigation")}</h1>

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
                <Select value={crop} onValueChange={setCrop}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(CROP_WATER).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("growthStage")}</Label>
                <Select value={stage} onValueChange={(v) => setStage(v as typeof stage)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => <SelectItem key={s} value={s}>{t(s as DictKey)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Irrigation efficiency (%)</Label>
                <Input type="number" min={30} max={95} value={efficiency} onChange={(e) => setEfficiency(Number(e.target.value) || 70)} />
              </div>
            </div>
          )}
        </div>

        {land && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <ResultCard label={t("waterPerWeek")} value={`${mmPerWeek.toFixed(1)} mm`} />
            <ResultCard label={t("totalVolume")} value={`${Math.round(litersPerWeek).toLocaleString()} ${t("liters")}`} />
            <ResultCard label={t("irrigationFreq")} value={t("everyNDays").replace("{n}", String(freqDays))} />
          </div>
        )}
      </main>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-tile">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold text-primary">{value}</div>
    </div>
  );
}
