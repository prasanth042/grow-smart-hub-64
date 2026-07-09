import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  crop: z.string().min(1),
  location: z.string().nullable(),
  language: z.enum(["en", "ta"]),
});

const PriceSchema = z.object({
  crop: z.string(),
  unit: z.string(),
  price_range_min: z.number(),
  price_range_max: z.number(),
  trend: z.enum(["rising", "stable", "falling"]),
  markets: z.array(
    z.object({
      name: z.string(),
      price: z.number(),
      note: z.string(),
    }),
  ),
  best_time_to_sell: z.string(),
  tips: z.array(z.string()),
  summary: z.string(),
  disclaimer: z.string(),
});

export const marketPrice = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key, { structuredOutputs: true });
    const model = gateway("openai/gpt-5-mini");

    const langLabel = data.language === "ta" ? "Tamil (தமிழ்)" : "English";
    const prompt = `You are a mandi (agri-market) price analyst for Tamil Nadu, India.
Estimate current wholesale prices for: ${data.crop}
Farmer location: ${data.location ?? "Tamil Nadu"}
Provide realistic INR prices per kg or quintal (state the unit), a min/max range, current market trend, 3-4 nearby mandi comparisons, best time to sell, and 3 practical selling tips.
Also include a short disclaimer that prices are AI estimates and to verify with local mandis.
Respond in ${langLabel}. Keep each tip under 20 words.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: PriceSchema }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("Could not fetch price estimates. Please try again.");
      }
      throw error;
    }
  });
