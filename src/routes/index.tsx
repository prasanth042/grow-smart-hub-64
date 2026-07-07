import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { Sprout, CloudSun, ScanLine, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { t } = useLang();
  const features = [
    { icon: Sprout, title: t("feature1Title"), body: t("feature1Body") },
    { icon: CloudSun, title: t("feature2Title"), body: t("feature2Body") },
    { icon: ScanLine, title: t("feature3Title"), body: t("feature3Body") },
    { icon: TrendingUp, title: t("feature4Title"), body: t("feature4Body") },
  ];

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main>
        <section className="gradient-hero">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-harvest" />
              Tamil · English · AI
            </div>
            <h1 className="mt-6 text-4xl sm:text-6xl font-bold tracking-tight">
              {t("appName")}
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground">
              {t("tagline")}
            </p>
            <p className="mt-3 mx-auto max-w-2xl text-sm text-muted-foreground">
              {t("heroCta1")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth">{t("getStarted")}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth">{t("signIn")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="card-tile card-tile-hover">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {t("appName")}
      </footer>
    </div>
  );
}
