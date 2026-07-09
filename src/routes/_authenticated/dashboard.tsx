import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { useLang, type DictKey } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sprout, CloudSun, Droplets, FlaskConical, ScanLine, Bug,
  Wheat, LineChart, Wallet, FileBarChart, MessageCircle, MapPin,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Smart Farmer Assistant" }] }),
  component: Dashboard,
});

type Tile = { key: DictKey; icon: typeof Sprout; to?: string; ready?: boolean };
const tiles: Tile[] = [
  { key: "landManagement", icon: MapPin, to: "/land", ready: true },
  { key: "cropPlanning", icon: Sprout, to: "/crop-planning", ready: true },
  { key: "weather", icon: CloudSun, to: "/weather", ready: true },
  { key: "irrigation", icon: Droplets, to: "/irrigation", ready: true },
  { key: "fertilizer", icon: FlaskConical, to: "/fertilizer", ready: true },
  { key: "disease", icon: ScanLine, to: "/disease", ready: true },
  { key: "pest", icon: Bug, to: "/disease", ready: true },
  { key: "harvest", icon: Wheat, to: "/harvest", ready: true },
  { key: "market", icon: LineChart, to: "/market", ready: true },
  { key: "expenses", icon: Wallet, to: "/expenses", ready: true },
  { key: "reports", icon: FileBarChart, to: "/reports", ready: true },
  { key: "chatbot", icon: MessageCircle, to: "/chatbot", ready: true },
];

function Dashboard() {
  const { t } = useLang();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").maybeSingle();
      return data;
    },
  });
  const { data: lands } = useQuery({
    queryKey: ["lands"],
    queryFn: async () => {
      const { data } = await supabase.from("lands").select("id, area_acres");
      return data ?? [];
    },
  });

  const totalAcres = (lands ?? []).reduce((s, l) => s + Number(l.area_acres ?? 0), 0);

  return (
    <div className="min-h-screen">
      <AppHeader authed />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("welcome")}</p>
            <h1 className="text-2xl font-bold">
              {profile?.full_name || t("dashboard")}
            </h1>
          </div>
          <div className="flex gap-3">
            <Stat label={t("parcels")} value={String(lands?.length ?? 0)} />
            <Stat label={`${t("totalLand")} (${t("acres")})`} value={totalAcres.toFixed(2)} />
          </div>
        </div>

        <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map((tile) => {
            const inner = (
              <div className={`card-tile ${tile.ready ? "card-tile-hover cursor-pointer" : "opacity-70"}`}>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <tile.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 font-medium">{t(tile.key)}</div>
                {!tile.ready && (
                  <div className="mt-1 text-xs text-muted-foreground">{t("comingSoon")}</div>
                )}
              </div>
            );
            return tile.ready && tile.to ? (
              <Link key={tile.key} to={tile.to}>{inner}</Link>
            ) : (
              <div key={tile.key}>{inner}</div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
