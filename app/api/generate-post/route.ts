import OpenAI from "openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

type Role = "user" | "assistant" | "system";
type ChatMessage = { id: string; role: Role; content: string; createdAt: number; };
type ProfileContext = { name: string; headline?: string; title?: string; company?: string; industry?: string; summary?: string; skills?: string[]; url?: string; };
type GenerationOptions = { tone: "Professional"|"Friendly"|"Bold"|"Inspiring"|"Analytical"|"Storytelling"; goal: "Awareness"|"Engagement"|"Lead Gen"|"Hiring"|"Event Promo"|"Product Launch"; audience: string; includeEmojis: boolean; minifyHashtags: boolean; length: "Short"|"Medium"|"Long"; useProfileContext: boolean; };

function buildSystemPrompt(opts: GenerationOptions, profile?: ProfileContext) {
  const persona = `You are an expert LinkedIn copywriter who writes crisp, high-signal posts with strong hooks, ${opts.includeEmojis ? "tasteful emojis" : "no emojis"}, and ${opts.minifyHashtags ? "minimal" : "descriptive"} hashtags. Match the tone: ${opts.tone}. Optimize for the goal: ${opts.goal}. Target audience: ${opts.audience}.`;
  const context = profile && opts.useProfileContext ? `\nUser profile: ${profile.name}${profile.title ? ", " + profile.title : ""}${profile.company ? " @ " + profile.company : ""}. Headline: ${profile.headline ?? ""}. Skills: ${(profile.skills ?? []).join(", ")}.` : "";
  return persona + context + "\nWrite in natural, non-repetitive language. Keep it scannable. Always include a clear CTA when appropriate.";
}

function buildUserPrompt(messages: ChatMessage[], opts: GenerationOptions) {
  const lastUser = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
  const lengthRule = opts.length === "Short" ? "50–90 words" : opts.length === "Medium" ? "110–160 words" : "180–260 words";
  return `Draft a LinkedIn post (${lengthRule}). Topic: ${lastUser}. Provide the post body only, no preface. Then propose 3–6 hashtags.`;
}

function extractHashtags(text: string): string[] {
  const tagSet = new Set<string>();
  for (const m of text.matchAll(/#[A-Za-z0-9_]+/g)) tagSet.add(m[0]);
  return [...tagSet];
}

export async function POST(req: NextRequest) {
  const { messages, opts, profile }: { messages: ChatMessage[]; opts: GenerationOptions; profile?: ProfileContext } = await req.json();

  const client = new OpenAI({
    baseURL: process.env.FIREWORKS_BASE_URL || "https://api.fireworks.ai/inference/v1",
    apiKey: process.env.FIREWORKS_API_KEY as string,
  });

  const system = buildSystemPrompt(opts, profile);
  const user = buildUserPrompt(messages, opts);

  const completion = await client.chat.completions.create({
    model: process.env.FIREWORKS_MODEL || "accounts/fireworks/models/mixtral-8x7b-instruct",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.7,
    top_p: 0.9,
  });

  const content = completion.choices?.[0]?.message?.content ?? "";
  const parts = content.split(/\n\s*\n/);
  const post = parts[0] ?? content;
  const tagsBlock = parts.slice(1).join("\n\n");
  const hashtags = extractHashtags(tagsBlock || content);

  return Response.json({
    id: Math.random().toString(36).slice(2),
    text: post.trim(),
    hashtags: hashtags.length ? hashtags : (opts.minifyHashtags ? ["#ai","#product","#buildinpublic"] : ["#ArtificialIntelligence","#ProductManagement","#BuildInPublic"]),
    suggestions: [
      "Tighten the first sentence for a stronger hook",
      "Add a concrete outcome or metric",
      "End with a question to invite comments",
    ],
  });
}
