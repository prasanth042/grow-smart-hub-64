import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_expenses",
  title: "List farm expenses",
  description: "List recent farm expenses for the signed-in farmer. Optionally filter by category or a start date.",
  inputSchema: {
    category: z.string().optional().describe("Optional expense category filter (e.g. seeds, fertilizer, labor)."),
    since: z.string().optional().describe("Optional ISO date (YYYY-MM-DD); only return expenses on/after this date."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, since, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supabaseForUser(ctx)
      .from("expenses")
      .select("id,amount,category,spent_on,note,land_id")
      .order("spent_on", { ascending: false })
      .limit(limit ?? 50);
    if (category) q = q.eq("category", category);
    if (since) q = q.gte("spent_on", since);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const total = (data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    return {
      content: [{ type: "text", text: `Total: ₹${total}\n${JSON.stringify(data, null, 2)}` }],
      structuredContent: { expenses: data ?? [], total_inr: total },
    };
  },
});
