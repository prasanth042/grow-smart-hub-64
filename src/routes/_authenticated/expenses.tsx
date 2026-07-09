import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Wallet, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses & Sales — Smart Farmer Assistant" },
      { name: "description", content: "Track farming expenses and crop sales to see your profit and loss." },
    ],
  }),
  component: ExpensesPage,
});

type Expense = { id: string; category: string; amount: number; note: string | null; spent_on: string; land_id: string | null };
type Sale = { id: string; crop: string; quantity_kg: number; price_per_kg: number; total_amount: number; market: string | null; sold_on: string; land_id: string | null };
type Land = { id: string; name: string };

const CATEGORIES = ["seeds", "fertilizer", "pesticide", "labor", "irrigation", "equipment", "transport", "other"];

function ExpensesPage() {
  const { t } = useLang();
  return (
    <div className="min-h-screen">
      <AppHeader authed />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> {t("dashboard")}</Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-6 w-6 text-primary" /> {t("expenses")}</h1>

        <Tabs defaultValue="expenses" className="mt-6">
          <TabsList>
            <TabsTrigger value="expenses">{t("expenses")}</TabsTrigger>
            <TabsTrigger value="sales">{t("sales")}</TabsTrigger>
          </TabsList>
          <TabsContent value="expenses" className="mt-4"><ExpensesTab /></TabsContent>
          <TabsContent value="sales" className="mt-4"><SalesTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function useLands() {
  return useQuery({
    queryKey: ["lands"],
    queryFn: async () => {
      const { data } = await supabase.from("lands").select("id,name");
      return (data ?? []) as Land[];
    },
  });
}

function ExpensesTab() {
  const { t } = useLang();
  const qc = useQueryClient();
  const { data: lands } = useLands();
  const [form, setForm] = useState({ category: "seeds", amount: "", note: "", spent_on: new Date().toISOString().slice(0, 10), land_id: "" });

  const { data: rows } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*").order("spent_on", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const amount = Number(form.amount);
      if (!amount || amount <= 0) throw new Error("Enter amount");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("expenses").insert({
        user_id: u.user.id,
        category: form.category,
        amount,
        note: form.note || null,
        spent_on: form.spent_on,
        land_id: form.land_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("saved"));
      setForm({ ...form, amount: "", note: "" });
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const total = (rows ?? []).reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-4">
      <div className="card-tile grid gap-3 sm:grid-cols-6">
        <div className="sm:col-span-2 space-y-1.5">
          <Label>{t("category")}</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label>{t("amount")} (₹)</Label>
          <Input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label>{t("date")}</Label>
          <Input type="date" value={form.spent_on} onChange={(e) => setForm({ ...form, spent_on: e.target.value })} />
        </div>
        <div className="sm:col-span-3 space-y-1.5">
          <Label>{t("notes")}</Label>
          <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
        <div className="sm:col-span-3 space-y-1.5">
          <Label>{t("selectLand")} ({t("optional")})</Label>
          <Select value={form.land_id || "none"} onValueChange={(v) => setForm({ ...form, land_id: v === "none" ? "" : v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {(lands ?? []).map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-6">
          <Button onClick={() => add.mutate()} disabled={add.isPending}><Plus className="h-4 w-4 mr-1" /> {t("addExpense")}</Button>
        </div>
      </div>

      <div className="card-tile">
        <div className="flex justify-between items-baseline">
          <div className="font-medium">{t("totalExpenses")}</div>
          <div className="text-xl font-bold text-destructive">₹{total.toLocaleString()}</div>
        </div>
      </div>

      <div className="space-y-2">
        {(rows ?? []).length === 0 ? (
          <div className="card-tile text-center text-muted-foreground py-6">{t("noEntries")}</div>
        ) : (
          rows!.map((r) => (
            <div key={r.id} className="card-tile flex items-center justify-between gap-3">
              <div>
                <div className="font-medium capitalize">{r.category} {r.note && <span className="text-muted-foreground font-normal">· {r.note}</span>}</div>
                <div className="text-xs text-muted-foreground">{r.spent_on}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-semibold text-destructive whitespace-nowrap">₹{Number(r.amount).toLocaleString()}</div>
                <Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SalesTab() {
  const { t } = useLang();
  const qc = useQueryClient();
  const { data: lands } = useLands();
  const [form, setForm] = useState({ crop: "", quantity_kg: "", price_per_kg: "", market: "", sold_on: new Date().toISOString().slice(0, 10), land_id: "" });

  const { data: rows } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("*").order("sold_on", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Sale[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const q = Number(form.quantity_kg);
      const p = Number(form.price_per_kg);
      if (!form.crop.trim()) throw new Error("Enter crop");
      if (!q || !p) throw new Error("Enter quantity and price");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("sales").insert({
        user_id: u.user.id,
        crop: form.crop.trim(),
        quantity_kg: q,
        price_per_kg: p,
        market: form.market || null,
        sold_on: form.sold_on,
        land_id: form.land_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("saved"));
      setForm({ ...form, crop: "", quantity_kg: "", price_per_kg: "", market: "" });
      qc.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales"] }),
  });

  const total = (rows ?? []).reduce((s, r) => s + Number(r.total_amount), 0);

  return (
    <div className="space-y-4">
      <div className="card-tile grid gap-3 sm:grid-cols-6">
        <div className="sm:col-span-2 space-y-1.5">
          <Label>{t("cropType")}</Label>
          <Input value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} placeholder="tomato" />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label>{t("quantity")} (kg)</Label>
          <Input type="number" min={0} value={form.quantity_kg} onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label>{t("pricePerKg")} (₹)</Label>
          <Input type="number" min={0} value={form.price_per_kg} onChange={(e) => setForm({ ...form, price_per_kg: e.target.value })} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label>{t("market")}</Label>
          <Input value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label>{t("date")}</Label>
          <Input type="date" value={form.sold_on} onChange={(e) => setForm({ ...form, sold_on: e.target.value })} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label>{t("selectLand")} ({t("optional")})</Label>
          <Select value={form.land_id || "none"} onValueChange={(v) => setForm({ ...form, land_id: v === "none" ? "" : v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {(lands ?? []).map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-6">
          <Button onClick={() => add.mutate()} disabled={add.isPending}><Plus className="h-4 w-4 mr-1" /> {t("addSale")}</Button>
        </div>
      </div>

      <div className="card-tile">
        <div className="flex justify-between items-baseline">
          <div className="font-medium">{t("totalRevenue")}</div>
          <div className="text-xl font-bold text-primary">₹{total.toLocaleString()}</div>
        </div>
      </div>

      <div className="space-y-2">
        {(rows ?? []).length === 0 ? (
          <div className="card-tile text-center text-muted-foreground py-6">{t("noEntries")}</div>
        ) : (
          rows!.map((r) => (
            <div key={r.id} className="card-tile flex items-center justify-between gap-3">
              <div>
                <div className="font-medium capitalize">{r.crop} <span className="text-muted-foreground font-normal">· {r.quantity_kg}kg × ₹{r.price_per_kg}</span></div>
                <div className="text-xs text-muted-foreground">{r.sold_on}{r.market ? ` · ${r.market}` : ""}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-semibold text-primary whitespace-nowrap">₹{Number(r.total_amount).toLocaleString()}</div>
                <Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
