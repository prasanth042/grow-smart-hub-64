import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  crop: z.string(),
  sowing_date: z.string(),
  area_acres: z.number(),
  soil_type: z.string().nullable(),
  water_source: z.string().nullable(),
  location: z.string().nullable(),
  language: z.enum(["en", "ta"]),
});

const Schema = z.object({
  days_to_harvest: z.number(),
  harvest_window_start: z.string(),
  harvest_window_end: z.string(),
  expected_yield_per_acre: z.string(),
  expected_yield_total: z.string(),
  current_stage: z.string(),
  next_actions: z.array(z.string()),
  harvest_tips: z.array(z.string()),
  risk_factors: z.array(z.string()),
});

export const harvestPredict = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key, { structuredOutputs: true });
    const model = gateway("openai/gpt-5-mini");

    const langLabel = data.language === "ta" ? "Tamil (தமிழ்)" : "English";
    const today = new Date().toISOString().slice(0, 10);
    const prompt = `You are an agronomy expert for Tamil Nadu farmers. Today is ${today}.
Predict harvest for:
Crop: ${data.crop}
Sowing date: ${data.sowing_date}
Area: ${data.area_acres} acres
Soil: ${data.soil_type ?? "unknown"}
Water: ${data.water_source ?? "unknown"}
Location: ${data.location ?? "Tamil Nadu"}

Return dates as YYYY-MM-DD. Include 3-5 next_actions, 3-5 harvest_tips, 2-4 risk_factors. Respond in ${langLabel}. Each item under 20 words.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: Schema }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("Could not generate prediction. Please try again.");
      }
      throw error;
    }
  });
