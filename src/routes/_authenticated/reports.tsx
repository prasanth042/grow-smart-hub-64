import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileBarChart, TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Smart Farmer Assistant" },
      { name: "description", content: "Profit and loss report from your farm expenses and sales." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { t } = useLang();

  const { data: expenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => (await supabase.from("expenses").select("category,amount,spent_on")).data ?? [],
  });
  const { data: sales } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => (await supabase.from("sales").select("crop,total_amount,sold_on")).data ?? [],
  });

  const totalExpense = (expenses ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const totalRevenue = (sales ?? []).reduce((s, r) => s + Number(r.total_amount), 0);
  const profit = totalRevenue - totalExpense;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  const byCategory = new Map<string, number>();
  (expenses ?? []).forEach((r) => byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + Number(r.amount)));
  const catList = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);

  const byCrop = new Map<string, number>();
  (sales ?? []).forEach((r) => byCrop.set(r.crop, (byCrop.get(r.crop) ?? 0) + Number(r.total_amount)));
  const cropList = Array.from(byCrop.entries()).sort((a, b) => b[1] - a[1]);

  const isProfit = profit >= 0;

  return (
    <div className="min-h-screen">
      <AppHeader authed />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> {t("dashboard")}</Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileBarChart className="h-6 w-6 text-primary" /> {t("reports")}</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Metric label={t("totalRevenue")} value={`₹${totalRevenue.toLocaleString()}`} tone="primary" />
          <Metric label={t("totalExpenses")} value={`₹${totalExpense.toLocaleString()}`} tone="danger" />
          <Metric
            label={isProfit ? t("profit") : t("loss")}
            value={`₹${Math.abs(profit).toLocaleString()}`}
            tone={isProfit ? "primary" : "danger"}
            icon={isProfit ? TrendingUp : TrendingDown}
          />
        </div>

        <div className="mt-4 card-tile">
          <div className="text-xs uppercase text-muted-foreground">{t("profitMargin")}</div>
          <div className={`text-3xl font-bold ${isProfit ? "text-primary" : "text-destructive"}`}>
            {margin.toFixed(1)}%
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={isProfit ? "h-full bg-primary" : "h-full bg-destructive"}
              style={{ width: `${Math.min(100, Math.abs(margin))}%` }}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="card-tile">
            <div className="font-medium mb-3">{t("expensesByCategory")}</div>
            {catList.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t("noEntries")}</div>
            ) : (
              <div className="space-y-2">
                {catList.map(([cat, amt]) => {
                  const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{cat}</span>
                        <span className="font-medium">₹{amt.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                        <div className="h-full bg-destructive" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card-tile">
            <div className="font-medium mb-3">{t("revenueByCrop")}</div>
            {cropList.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t("noEntries")}</div>
            ) : (
              <div className="space-y-2">
                {cropList.map(([crop, amt]) => {
                  const pct = totalRevenue > 0 ? (amt / totalRevenue) * 100 : 0;
                  return (
                    <div key={crop}>
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{crop}</span>
                        <span className="font-medium">₹{amt.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, tone, icon: Icon }: { label: string; value: string; tone: "primary" | "danger"; icon?: typeof TrendingUp }) {
  const cls = tone === "primary" ? "text-primary" : "text-destructive";
  return (
    <div className="card-tile">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold flex items-center gap-2 ${cls}`}>
        {Icon && <Icon className="h-5 w-5" />}
        {value}
      </div>
    </div>
  );
}
