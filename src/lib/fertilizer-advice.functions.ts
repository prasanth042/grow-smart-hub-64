import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  crop: z.string(),
  soil_type: z.string().nullable(),
  area_acres: z.number(),
  stage: z.enum(["seedling", "vegetative", "flowering", "fruiting", "maturity"]),
  language: z.enum(["en", "ta"]),
});

const Schema = z.object({
  npk: z.object({
    nitrogen_kg: z.number(),
    phosphorus_kg: z.number(),
    potassium_kg: z.number(),
  }),
  primary: z.array(
    z.object({
      name: z.string(),
      quantity: z.string(),
      when: z.string(),
      how: z.string(),
    }),
  ),
  organic: z.array(z.string()),
  micronutrient_tips: z.array(z.string()),
  warnings: z.array(z.string()),
});

export const fertilizerAdvice = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key, { structuredOutputs: true });
    const model = gateway("openai/gpt-5-mini");

    const langLabel = data.language === "ta" ? "Tamil (தமிழ்)" : "English";
    const prompt = `You are a soil nutrition expert for Tamil Nadu farmers.
Give a fertilizer plan for:
Crop: ${data.crop}
Soil: ${data.soil_type ?? "unknown"}
Area: ${data.area_acres} acres
Growth stage: ${data.stage}

Return NPK totals in kg for the whole area, 2-4 primary fertilizer applications (urea, DAP, MOP, complex etc.) with quantity/when/how, 2-3 organic amendments, 2-3 micronutrient tips, and 1-2 safety warnings. Respond in ${langLabel}. Keep each field under 20 words.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: Schema }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("Could not generate plan. Please try again.");
      }
      throw error;
    }
  });
