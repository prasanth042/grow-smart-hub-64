import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import { AppHeader } from "@/components/app-header";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageCircle, Send, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chatbot")({
  head: () => ({
    meta: [
      { title: "AI Assistant — Smart Farmer Assistant" },
      { name: "description", content: "Chat with an AI farming assistant in Tamil or English about crops, weather, pests, and markets." },
    ],
  }),
  component: ChatbotPage,
});

function ChatbotPage() {
  const { t, lang } = useLang();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { language: lang },
    }),
  });

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  async function submit() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  const suggestions = lang === "ta"
    ? ["என் மண்ணுக்கு எந்த பயிர் சிறந்தது?", "தக்காளி இலைகளில் மஞ்சள் புள்ளிகள் ஏன்?", "நெல்லுக்கு எப்போது உரம் இட வேண்டும்?"]
    : ["Which crop is best for clay soil in Kharif?", "Why are my tomato leaves yellow?", "Best time to apply urea for paddy?"];

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader authed />
      <main className="mx-auto w-full max-w-3xl px-4 py-6 flex-1 flex flex-col">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 self-start">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> {t("dashboard")}</Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><MessageCircle className="h-6 w-6 text-primary" /> {t("chatbot")}</h1>

        <div className="mt-4 flex-1 card-tile flex flex-col min-h-[60vh]">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground max-w-sm">{t("chatIntro")}</p>
                <div className="mt-4 grid gap-2 w-full max-w-md">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 0); }}
                      className="text-left text-sm rounded-lg border border-border hover:bg-muted px-3 py-2 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{text}</p>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-headings:mt-2 prose-headings:mb-1">
                          <ReactMarkdown>{text || "…"}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {status === "submitted" && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-pulse" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-pulse [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-pulse [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="mt-4 flex items-end gap-2">
            <Textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
              }}
              placeholder={t("askAnything")}
              className="resize-none"
            />
            <Button onClick={submit} disabled={busy || !input.trim()} size="icon" className="h-10 w-10 shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
