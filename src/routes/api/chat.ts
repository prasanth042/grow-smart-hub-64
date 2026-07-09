import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type ChatRequestBody = { messages?: unknown; language?: "en" | "ta" };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("openai/gpt-5-mini");

        const lang = body.language === "ta" ? "Tamil (தமிழ்)" : "English";
        const system = `You are Smart Farmer Assistant, a friendly AI helper for smallholder farmers in Tamil Nadu, India.
Reply in ${lang}. Give concise, practical advice on crops, soil, water, fertilizer, pests, diseases, weather, harvesting, and market selling.
Use markdown with bullet points and short sections. Use local units (acres, kg, INR). If a question is off-topic, gently steer back to farming.`;

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(body.messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
        });
      },
    },
  },
});
