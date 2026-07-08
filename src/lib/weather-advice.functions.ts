import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  location: z.string(),
  crops: z.array(z.string()),
  forecastSummary: z.string(),
  language: z.enum(["en", "ta"]),
});

export const weatherAdvice = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("openai/gpt-5-mini");

    const langLabel = data.language === "ta" ? "Tamil (தமிழ்)" : "English";
    const prompt = `You are a farming assistant for Tamil Nadu, India.
Location: ${data.location}
Current crops: ${data.crops.join(", ") || "none specified"}

7-day weather forecast:
${data.forecastSummary}

Give 4-6 concise, actionable farming recommendations for the next 7 days based on this forecast (irrigation, spraying, sowing, harvesting warnings). Use bullet points starting with "- ". Respond in ${langLabel}. Keep each point under 25 words.`;

    const { text } = await generateText({ model, prompt });
    return { advice: text };
  });
