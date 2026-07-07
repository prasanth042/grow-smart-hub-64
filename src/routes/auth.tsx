import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLang } from "@/lib/i18n";
import { toast } from "sonner";
import { Leaf } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Smart Farmer Assistant" },
      { name: "description", content: "Sign in or create your farmer account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function signInWithGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error(result.error.message);
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleEmailAuth(e: React.FormEvent<HTMLFormElement>, mode: "signin" | "signup") {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("full_name") ?? "");
    const phone = String(form.get("phone") ?? "");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: { full_name: fullName, phone },
          },
        });
        if (error) throw error;
        toast.success(lang === "ta" ? "கணக்கு உருவாக்கப்பட்டது" : "Account created");
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="gradient-hero">
        <div className="mx-auto max-w-md px-4 py-16">
          <div className="card-tile">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Leaf className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-xl font-semibold">{t("appName")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("tagline")}</p>
            </div>

            <Button
              type="button"
              onClick={signInWithGoogle}
              disabled={loading}
              variant="outline"
              className="mt-6 w-full"
            >
              <GoogleIcon /> {t("continueWithGoogle")}
            </Button>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              {t("or")}
              <div className="h-px flex-1 bg-border" />
            </div>

            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t("signIn")}</TabsTrigger>
                <TabsTrigger value="signup">{t("signUp")}</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form className="space-y-3" onSubmit={(e) => handleEmailAuth(e, "signin")}>
                  <Field name="email" label={t("email")} type="email" required />
                  <Field name="password" label={t("password")} type="password" required />
                  <Button type="submit" disabled={loading} className="w-full">
                    {t("signIn")}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form className="space-y-3" onSubmit={(e) => handleEmailAuth(e, "signup")}>
                  <Field name="full_name" label={t("fullName")} required />
                  <Field name="phone" label={t("phone")} type="tel" />
                  <Field name="email" label={t("email")} type="email" required />
                  <Field name="password" label={t("password")} type="password" required minLength={6} />
                  <Button type="submit" disabled={loading} className="w-full">
                    {t("signUp")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, name, ...rest } = props;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...rest} />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1a6.9 6.9 0 010-4.2V7.07H2.18a10.99 10.99 0 000 9.86l3.66-2.83z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
