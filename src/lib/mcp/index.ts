import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listLands from "./tools/list-lands";
import listExpenses from "./tools/list-expenses";
import recordExpense from "./tools/record-expense";
import listSales from "./tools/list-sales";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "smart-farmer-assistant-mcp",
  title: "Smart Farmer Assistant",
  version: "0.1.0",
  instructions:
    "Tools for the Smart Farmer Assistant app. Use these to read the signed-in farmer's lands, expenses and sales, and to record new expenses. All data is scoped to the authenticated user via Supabase RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listLands, listExpenses, recordExpense, listSales],
});
