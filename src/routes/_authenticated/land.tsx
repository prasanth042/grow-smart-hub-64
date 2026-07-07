import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { useLang } from "@/lib/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MapPin, ArrowLeft } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/land")({
  head: () => ({ meta: [{ title: "Land Management — Smart Farmer Assistant" }] }),
  component: LandPage,
});

const SOILS = ["clay","sandy","loamy","silty","peaty","chalky","black","red","alluvial"] as const;
const WATER = ["rainfed","borewell","canal","river","pond","drip","sprinkler"] as const;

type SoilType = typeof SOILS[number];
type WaterSource = typeof WATER[number];

type Land = {
  id: string;
  name: string;
  area_acres: number;
  soil_type: SoilType | null;
  water_source: WaterSource | null;
  location: string | null;
  notes: string | null;
};

function LandPage() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Land | null>(null);
  const [open, setOpen] = useState(false);

  const { data: lands, isLoading } = useQuery({
    queryKey: ["lands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lands").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Land[];
    },
  });

  const save = useMutation({
    mutationFn: async (values: Omit<Land, "id"> & { id?: string }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const user_id = userRes.user?.id;
      if (!user_id) throw new Error("Not signed in");
      if (values.id) {
        const { error } = await supabase.from("lands").update(values).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lands").insert({ ...values, user_id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lands"] });
      setOpen(false);
      setEditing(null);
      toast.success(lang === "ta" ? "சேமிக்கப்பட்டது" : "Saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lands").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lands"] });
      toast.success(lang === "ta" ? "நீக்கப்பட்டது" : "Deleted");
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    save.mutate({
      id: editing?.id,
      name: String(fd.get("name")),
      area_acres: Number(fd.get("area_acres")),
      soil_type: (fd.get("soil_type") as string) || null,
      water_source: (fd.get("water_source") as string) || null,
      location: (fd.get("location") as string) || null,
      notes: (fd.get("notes") as string) || null,
    });
  }

  return (
    <div className="min-h-screen">
      <AppHeader authed />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
              <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> {t("dashboard")}</Link>
            </Button>
            <h1 className="text-2xl font-bold">{t("landManagement")}</h1>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> {t("addLand")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? t("editLand") : t("addLand")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <F label={t("landName")}><Input name="name" defaultValue={editing?.name} required /></F>
                <F label={t("area")}><Input name="area_acres" type="number" step="0.01" min="0.01" defaultValue={editing?.area_acres} required /></F>
                <F label={t("soilType")}>
                  <Select name="soil_type" defaultValue={editing?.soil_type ?? undefined}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{SOILS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </F>
                <F label={t("waterSource")}>
                  <Select name="water_source" defaultValue={editing?.water_source ?? undefined}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{WATER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </F>
                <F label={t("location")}><Input name="location" defaultValue={editing?.location ?? ""} /></F>
                <F label={t("notes")}><Textarea name="notes" defaultValue={editing?.notes ?? ""} rows={2} /></F>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
                  <Button type="submit" disabled={save.isPending}>{t("save")}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full text-sm text-muted-foreground">…</div>
          ) : (lands?.length ?? 0) === 0 ? (
            <div className="col-span-full card-tile text-center text-muted-foreground">
              {t("noLands")}
            </div>
          ) : (
            lands!.map((l) => (
              <div key={l.id} className="card-tile">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{l.name}</div>
                    <div className="text-sm text-muted-foreground">{l.area_acres} {t("acres")}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(l); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("delete")}?</AlertDialogTitle>
                          <AlertDialogDescription>{l.name}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => del.mutate(l.id)}>{t("delete")}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {l.soil_type && <div>🌱 {l.soil_type}</div>}
                  {l.water_source && <div>💧 {l.water_source}</div>}
                  {l.location && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{l.location}</div>}
                  {l.notes && <div className="line-clamp-2">{l.notes}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
