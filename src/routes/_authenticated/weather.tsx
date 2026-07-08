import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/app-header";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { weatherAdvice } from "@/lib/weather-advice.functions";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CloudSun, MapPin, Sparkles, Droplets, Wind, Thermometer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/weather")({
  head: () => ({
    meta: [
      { title: "Weather Monitoring — Smart Farmer Assistant" },
      { name: "description", content: "7-day forecast with AI-generated farming advice for your location." },
    ],
  }),
  component: WeatherPage,
});

type Forecast = {
  location: string;
  current: { temp: number; humidity: number; wind: number; precipitation: number };
  daily: { date: string; tmax: number; tmin: number; rain: number; code: number }[];
};

async function fetchForecast(lat: number, lon: number, label: string): Promise<Forecast> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto&forecast_days=7`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Weather fetch failed");
  const j = await r.json();
  return {
    location: label,
    current: {
      temp: j.current.temperature_2m,
      humidity: j.current.relative_humidity_2m,
      wind: j.current.wind_speed_10m,
      precipitation: j.current.precipitation,
    },
    daily: j.daily.time.map((d: string, i: number) => ({
      date: d,
      tmax: j.daily.temperature_2m_max[i],
      tmin: j.daily.temperature_2m_min[i],
      rain: j.daily.precipitation_sum[i],
      code: j.daily.weather_code[i],
    })),
  };
}

async function geocode(name: string) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`);
  const j = await r.json();
  const res = j.results?.[0];
  if (!res) throw new Error("Location not found");
  return { lat: res.latitude, lon: res.longitude, label: `${res.name}${res.admin1 ? ", " + res.admin1 : ""}` };
}

function WeatherPage() {
  const { t, lang } = useLang();
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const call = useServerFn(weatherAdvice);

  const { data: lands } = useQuery({
    queryKey: ["lands"],
    queryFn: async () => {
      const { data } = await supabase.from("lands").select("name,location");
      return data ?? [];
    },
  });

  async function loadByLocation(name: string) {
    setLoading(true);
    try {
      const g = await geocode(name);
      const f = await fetchForecast(g.lat, g.lon, g.label);
      setForecast(f);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function useMyLocation() {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const f = await fetchForecast(pos.coords.latitude, pos.coords.longitude, t("useMyLocation"));
          setForecast(f);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : String(e));
        } finally {
          setLoading(false);
        }
      },
      (err) => { toast.error(err.message); setLoading(false); },
    );
  }

  const advice = useMutation({
    mutationFn: async () => {
      if (!forecast) throw new Error("No forecast");
      const summary = forecast.daily
        .map((d) => `${d.date}: ${d.tmin}–${d.tmax}°C, rain ${d.rain}mm`)
        .join("\n");
      return await call({
        data: {
          location: forecast.location,
          crops: (lands ?? []).map((l) => l.name),
          forecastSummary: summary,
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
        <h1 className="text-2xl font-bold flex items-center gap-2"><CloudSun className="h-6 w-6 text-primary" /> {t("weather")}</h1>

        <div className="mt-6 card-tile">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label>{t("location")}</Label>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Chennai, Coimbatore, Madurai…" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => query && loadByLocation(query)} disabled={loading || !query}>
                <MapPin className="h-4 w-4 mr-1" /> {t("weatherFor" as never as "location") /* not used */}
                {t("recommend").slice(0,0)}Search
              </Button>
              <Button variant="outline" onClick={useMyLocation} disabled={loading}>
                {loading ? t("locating") : t("useMyLocation")}
              </Button>
            </div>
          </div>
          {lands && lands.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {lands.filter(l => l.location).map((l, i) => (
                <Button key={i} size="sm" variant="ghost" className="h-7 text-xs" onClick={() => loadByLocation(l.location!)}>
                  📍 {l.location}
                </Button>
              ))}
            </div>
          )}
        </div>

        {forecast && (
          <>
            <div className="mt-6 card-tile">
              <div className="text-sm text-muted-foreground">{t("today")} · {forecast.location}</div>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Metric icon={<Thermometer className="h-4 w-4" />} label={t("temperature")} value={`${forecast.current.temp}°C`} />
                <Metric icon={<Droplets className="h-4 w-4" />} label={t("humidity")} value={`${forecast.current.humidity}%`} />
                <Metric icon={<CloudSun className="h-4 w-4" />} label={t("rain")} value={`${forecast.current.precipitation} mm`} />
                <Metric icon={<Wind className="h-4 w-4" />} label={t("wind")} value={`${forecast.current.wind} km/h`} />
              </div>
            </div>

            <div className="mt-4 card-tile">
              <div className="font-medium mb-3">{t("forecast7")}</div>
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                {forecast.daily.map((d) => (
                  <div key={d.date} className="rounded border border-border/60 p-2 text-center">
                    <div className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "short", day: "numeric" })}</div>
                    <div className="text-sm font-semibold mt-1">{Math.round(d.tmax)}° / {Math.round(d.tmin)}°</div>
                    <div className="text-xs text-primary mt-0.5">{d.rain} mm</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 card-tile">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> {t("aiAdvice")}</div>
                <Button size="sm" onClick={() => advice.mutate()} disabled={advice.isPending}>
                  {advice.isPending ? t("generating") : t("recommend")}
                </Button>
              </div>
              {advice.data && (
                <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{advice.data.advice}</div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded border border-border/60 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
