import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Leaf, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useLang, type Lang } from "@/lib/i18n";
import { toast } from "sonner";

export function AppHeader({ authed = false }: { authed?: boolean }) {
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hasSession, setHasSession] = useState(authed);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setHasSession(!!session);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success(lang === "ta" ? "வெளியேறியது" : "Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="font-semibold text-base sm:text-lg">{t("appName")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle lang={lang} setLang={setLang} />
          {hasSession ? (
            <>
              {pathname !== "/dashboard" && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/dashboard">{t("dashboard")}</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link to="/profile"><User className="h-4 w-4" /></Link>
              </Button>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("signOut")}</span>
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">{t("signIn")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
      <button
        onClick={() => setLang("en")}
        className={`px-2.5 py-1.5 font-medium transition ${lang === "en" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:bg-accent"}`}
      >
        EN
      </button>
      <button
        onClick={() => setLang("ta")}
        className={`px-2.5 py-1.5 font-medium transition ${lang === "ta" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:bg-accent"}`}
      >
        தமிழ்
      </button>
    </div>
  );
}
