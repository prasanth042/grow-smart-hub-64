import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  imageBase64: z.string().min(10),
  mimeType: z.string().default("image/jpeg"),
  crop: z.string().nullable(),
  language: z.enum(["en", "ta"]),
});

export type DiseaseResult = {
  diagnosis: string;
  confidence: "high" | "medium" | "low";
  severity: "healthy" | "mild" | "moderate" | "severe";
  symptoms: string[];
  causes: string[];
  organic_treatment: string[];
  chemical_treatment: string[];
  prevention: string[];
};

export const detectDisease = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<DiseaseResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const langLabel = data.language === "ta" ? "Tamil (தமிழ்)" : "English";
    const prompt = `You are a plant pathology expert for Indian (Tamil Nadu) farmers.
Analyze this crop photo${data.crop ? ` (crop: ${data.crop})` : ""} and return ONLY a valid JSON object with these exact keys:
{
  "diagnosis": "short name of disease/pest or 'Healthy plant'",
  "confidence": "high" | "medium" | "low",
  "severity": "healthy" | "mild" | "moderate" | "severe",
  "symptoms": ["visible symptom 1", ...],
  "causes": ["cause 1", ...],
  "organic_treatment": ["step 1", ...],
  "chemical_treatment": ["step 1", ...],
  "prevention": ["tip 1", ...]
}
All text must be in ${langLabel}. Each item under 20 words. Use 3-5 items per array. Give practical, locally-available remedies. Return ONLY the JSON, no markdown fences.`;

    const dataUrl = `data:${data.mimeType};base64,${data.imageBase64}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
      throw new Error(`AI error: ${errText.slice(0, 200)}`);
    }
    const json = await res.json();
    const text: string = json.choices?.[0]?.message?.content ?? "";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
    try {
      return JSON.parse(cleaned) as DiseaseResult;
    } catch {
      throw new Error("Could not parse diagnosis. Please try another photo.");
    }
  });
