import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "record_expense",
  title: "Record a farm expense",
  description: "Insert a new expense for the signed-in farmer.",
  inputSchema: {
    amount: z.number().positive().describe("Amount in INR."),
    category: z.string().min(1).describe("Category, e.g. seeds, fertilizer, labor, fuel."),
    spent_on: z.string().optional().describe("Date the money was spent (YYYY-MM-DD). Defaults to today."),
    note: z.string().optional().describe("Optional description."),
    land_id: z.string().uuid().optional().describe("Optional land parcel ID this expense belongs to."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ amount, category, spent_on, note, land_id }, ctx) => {
    const userId = ctx.getUserId();
    if (!ctx.isAuthenticated() || !userId) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("expenses")
      .insert({
        user_id: userId,
        amount,
        category,
        spent_on: spent_on ?? new Date().toISOString().slice(0, 10),
        note: note ?? null,
        land_id: land_id ?? null,
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Recorded ₹${amount} (${category}).` }],
      structuredContent: { expense: data },
    };
  },
});
