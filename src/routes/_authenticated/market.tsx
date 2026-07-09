import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/app-header";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { marketPrice } from "@/lib/market-price.functions";
import { ArrowLeft, LineChart, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/market")({
  head: () => ({
    meta: [
      { title: "Market Prices — Smart Farmer Assistant" },
      { name: "description", content: "AI-estimated mandi prices, trends, and best time to sell your crop." },
    ],
  }),
  component: MarketPage,
});

function MarketPage() {
  const { t, lang } = useLang();
  const [crop, setCrop] = useState("");
  const [location, setLocation] = useState("");
  const call = useServerFn(marketPrice);

  const mut = useMutation({
    mutationFn: async () => {
      if (!crop.trim()) throw new Error("Enter a crop");
      return await call({ data: { crop: crop.trim(), location: location.trim() || null, language: lang } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const r = mut.data;
  const TrendIcon = r?.trend === "rising" ? TrendingUp : r?.trend === "falling" ? TrendingDown : Minus;
  const trendCls =
    r?.trend === "rising" ? "text-primary" :
    r?.trend === "falling" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="min-h-screen">
      <AppHeader authed />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> {t("dashboard")}</Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><LineChart className="h-6 w-6 text-primary" /> {t("market")}</h1>

        <div className="mt-6 card-tile grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("cropType")}</Label>
            <Input placeholder="e.g. tomato, rice, cotton" value={crop} onChange={(e) => setCrop(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("location")}</Label>
            <Input placeholder="e.g. Coimbatore" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
              <Sparkles className="h-4 w-4 mr-1" />
              {mut.isPending ? t("generating") : t("checkPrices")}
            </Button>
          </div>
        </div>

        {r && (
          <div className="mt-6 space-y-4">
            <div className="card-tile">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">{r.crop}</div>
                  <div className="text-2xl font-bold text-primary">
                    ₹{r.price_range_min} – ₹{r.price_range_max}
                    <span className="text-sm text-muted-foreground font-normal"> / {r.unit}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${trendCls}`}>
                  <TrendIcon className="h-4 w-4" /> {r.trend}
                </div>
              </div>
              <p className="mt-3 text-sm">{r.summary}</p>
            </div>

            <div className="card-tile">
              <div className="font-medium mb-2">{t("nearbyMarkets")}</div>
              <div className="space-y-2">
                {r.markets.map((m, i) => (
                  <div key={i} className="flex justify-between items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.note}</div>
                    </div>
                    <div className="text-primary font-semibold whitespace-nowrap">₹{m.price} / {r.unit}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-tile bg-primary/5 border-primary/20">
              <div className="text-xs uppercase text-muted-foreground">{t("bestTimeToSell")}</div>
              <p className="mt-1 text-sm">{r.best_time_to_sell}</p>
            </div>

            {r.tips.length > 0 && (
              <div className="card-tile">
                <div className="font-medium mb-2">{t("sellingTips")}</div>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  {r.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
              </div>
            )}

            <p className="text-xs text-muted-foreground italic">{r.disclaimer}</p>
          </div>
        )}
      </main>
    </div>
  );
}
