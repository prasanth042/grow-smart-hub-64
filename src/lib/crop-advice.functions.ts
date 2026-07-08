import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  soil_type: z.string().nullable(),
  water_source: z.string().nullable(),
  area_acres: z.number(),
  location: z.string().nullable(),
  season: z.string(),
  language: z.enum(["en", "ta"]),
});

const CropSchema = z.object({
  crops: z.array(
    z.object({
      name: z.string(),
      suitability: z.enum(["excellent", "good", "fair"]),
      duration_days: z.number(),
      expected_yield: z.string(),
      water_need: z.enum(["low", "medium", "high"]),
      why: z.string(),
      tips: z.array(z.string()),
    }),
  ),
  summary: z.string(),
});

export const recommendCrops = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key, { structuredOutputs: true });
    const model = gateway("openai/gpt-5-mini");

    const langLabel = data.language === "ta" ? "Tamil (தமிழ்)" : "English";
    const prompt = `You are an agronomy expert for Indian (Tamil Nadu) smallholder farmers.
Recommend the 4 most suitable crops for the following land.

Soil type: ${data.soil_type ?? "unknown"}
Water source: ${data.water_source ?? "unknown"}
Area: ${data.area_acres} acres
Location: ${data.location ?? "Tamil Nadu, India"}
Season: ${data.season}

Respond in ${langLabel}. Keep each "why" and each tip under 20 words. Give practical, region-appropriate crops.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: CropSchema }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("Could not generate recommendations. Please try again.");
      }
      throw error;
    }
  });
