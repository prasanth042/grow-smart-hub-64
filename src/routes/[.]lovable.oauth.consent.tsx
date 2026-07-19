import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

// Beta namespace — provide a local typed wrapper.
type OAuthResult = {
  data?: {
    client?: { name?: string; client_name?: string; redirect_uris?: string[] };
    redirect_url?: string;
    redirect_to?: string;
    scope?: string;
    scopes?: string[];
  } | null;
  error?: { message: string } | null;
};
type OAuthNS = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
function oauthApi(): OAuthNS {
  return (supabase.auth as unknown as { oauth: OAuthNS }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-lg font-semibold">Authorization error</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Could not load this authorization request: {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauthApi().approveAuthorization(authorization_id)
      : await oauthApi().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "an app";

  return (
    <main className="min-h-screen grid place-items-center px-4 py-12">
      <div className="w-full max-w-md card-tile">
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Connect {clientName}</h1>
            <p className="text-xs text-muted-foreground">Smart Farmer Assistant</p>
          </div>
        </div>

        <p className="text-sm mb-3">
          <strong>{clientName}</strong> is asking to connect to your Smart Farmer Assistant account.
          It will be able to call this app's enabled tools while you are signed in.
        </p>

        <ul className="text-sm space-y-1 mb-4 list-disc pl-5 text-muted-foreground">
          <li>Read your registered lands, expenses and sales</li>
          <li>Record new farm expenses on your behalf</li>
        </ul>

        <p className="text-xs text-muted-foreground mb-6">
          This does not bypass this app's permissions or backend policies. You can disconnect at any time from the client app.
        </p>

        {error && <p role="alert" className="text-sm text-destructive mb-3">{error}</p>}

        <div className="flex gap-2">
          <Button onClick={() => decide(true)} disabled={busy} className="flex-1">
            {busy ? "Working…" : "Approve"}
          </Button>
          <Button onClick={() => decide(false)} disabled={busy} variant="outline" className="flex-1">
            Cancel connection
          </Button>
        </div>
      </div>
    </main>
  );
}
