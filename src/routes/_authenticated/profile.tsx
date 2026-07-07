import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { useLang } from "@/lib/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Smart Farmer Assistant" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, lang, setLang } = useLang();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (v: { full_name: string; phone: string; village: string; district: string; preferred_language: "en" | "ta" }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const id = userRes.user?.id;
      if (!id) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").upsert({ id, ...v });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      setLang(v.preferred_language);
      toast.success(lang === "ta" ? "சேமிக்கப்பட்டது" : "Saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <div className="min-h-screen">
      <AppHeader authed />
      <main className="mx-auto max-w-xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> {t("dashboard")}</Link>
        </Button>
        <h1 className="text-2xl font-bold">{t("profile")}</h1>
        <form
          className="mt-6 card-tile space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            save.mutate({
              full_name: String(fd.get("full_name") ?? ""),
              phone: String(fd.get("phone") ?? ""),
              village: String(fd.get("village") ?? ""),
              district: String(fd.get("district") ?? ""),
              preferred_language: (String(fd.get("preferred_language")) as "en" | "ta") || "en",
            });
          }}
        >
          <F label={t("fullName")}><Input name="full_name" defaultValue={profile?.full_name ?? ""} /></F>
          <F label={t("phone")}><Input name="phone" type="tel" defaultValue={profile?.phone ?? ""} /></F>
          <F label={t("village")}><Input name="village" defaultValue={profile?.village ?? ""} /></F>
          <F label={t("district")}><Input name="district" defaultValue={profile?.district ?? ""} /></F>
          <F label={t("language")}>
            <select name="preferred_language" defaultValue={profile?.preferred_language ?? lang} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
            </select>
          </F>
          <Button type="submit" disabled={save.isPending}>{t("save")}</Button>
        </form>
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
