import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_sales",
  title: "List crop sales",
  description: "List recent crop sales for the signed-in farmer, with revenue totals.",
  inputSchema: {
    crop: z.string().optional().describe("Optional crop filter (e.g. paddy, tomato)."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ crop, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supabaseForUser(ctx)
      .from("sales")
      .select("id,crop,quantity_kg,price_per_kg,total_amount,market,sold_on,land_id")
      .order("sold_on", { ascending: false })
      .limit(limit ?? 50);
    if (crop) q = q.eq("crop", crop);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const revenue = (data ?? []).reduce((s, r) => s + Number(r.total_amount ?? 0), 0);
    return {
      content: [{ type: "text", text: `Revenue: ₹${revenue}\n${JSON.stringify(data, null, 2)}` }],
      structuredContent: { sales: data ?? [], revenue_inr: revenue },
    };
  },
});
