import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/app-header";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { detectDisease, type DiseaseResult } from "@/lib/disease-detect.functions";
import { ArrowLeft, ScanLine, Upload, Camera, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/disease")({
  head: () => ({
    meta: [
      { title: "Disease Detection — Smart Farmer Assistant" },
      { name: "description", content: "Snap a photo of your crop and get instant AI diagnosis and treatment." },
    ],
  }),
  component: DiseasePage,
});

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, base64] = result.split(",");
      const mimeType = header.match(/data:(.*?);/)?.[1] ?? file.type ?? "image/jpeg";
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function DiseasePage() {
  const { t, lang } = useLang();
  const [crop, setCrop] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [payload, setPayload] = useState<{ base64: string; mimeType: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const call = useServerFn(detectDisease);

  const mut = useMutation({
    mutationFn: async (): Promise<DiseaseResult> => {
      if (!payload) throw new Error("Please choose a photo.");
      return await call({
        data: {
          imageBase64: payload.base64,
          mimeType: payload.mimeType,
          crop: crop || null,
          language: lang,
        },
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  async function onPick(f: File | null) {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Image too large (max 8MB)");
      return;
    }
    const { base64, mimeType } = await fileToBase64(f);
    setPayload({ base64, mimeType });
    setPreview(`data:${mimeType};base64,${base64}`);
    mut.reset();
  }

  return (
    <div className="min-h-screen">
      <AppHeader authed />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> {t("dashboard")}</Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScanLine className="h-6 w-6 text-primary" /> {t("disease")}
        </h1>

        <div className="mt-6 card-tile space-y-4">
          <div className="space-y-1.5">
            <Label>{t("cropType")}</Label>
            <Input placeholder="e.g. tomato, rice, cotton" value={crop} onChange={(e) => setCrop(e.target.value)} />
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />

          {preview ? (
            <div className="space-y-2">
              <img src={preview} alt="crop" className="w-full max-h-80 object-contain rounded-lg border border-border" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-1" /> {t("chooseAnother")}
                </Button>
                <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
                  <Sparkles className="h-4 w-4 mr-1" />
                  {mut.isPending ? t("generating") : t("analyze")}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors"
            >
              <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
              <div className="mt-2 font-medium">{t("uploadPhoto")}</div>
              <div className="text-xs text-muted-foreground mt-1">{t("uploadPhotoHint")}</div>
            </button>
          )}
        </div>

        {mut.data && <DiagnosisView r={mut.data} />}
      </main>
    </div>
  );
}

function DiagnosisView({ r }: { r: DiseaseResult }) {
  const { t } = useLang();
  const sev = r.severity;
  const sevCls =
    sev === "healthy" ? "bg-primary/15 text-primary" :
    sev === "mild" ? "bg-accent text-accent-foreground" :
    sev === "moderate" ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" :
    "bg-destructive/15 text-destructive";
  return (
    <div className="mt-6 space-y-4">
      <div className="card-tile">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs uppercase text-muted-foreground">{t("diagnosis")}</div>
            <div className="text-xl font-semibold">{r.diagnosis}</div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sevCls}`}>{sev}</span>
            <span className="text-[10px] text-muted-foreground">{t("confidence")}: {r.confidence}</span>
          </div>
        </div>
      </div>

      <Section title={t("symptoms")} items={r.symptoms} />
      <Section title={t("causes")} items={r.causes} />
      <Section title={t("organicTreatment")} items={r.organic_treatment} accent />
      <Section title={t("chemicalTreatment")} items={r.chemical_treatment} />
      <Section title={t("prevention")} items={r.prevention} />
    </div>
  );
}

function Section({ title, items, accent }: { title: string; items: string[]; accent?: boolean }) {
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
