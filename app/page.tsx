"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant" | "system";
type ChatMessage = { id: string; role: Role; content: string; createdAt: number; };
type GenerationOptions = {
  tone: "Professional" | "Friendly" | "Bold" | "Inspiring" | "Analytical" | "Storytelling";
  goal: "Awareness" | "Engagement" | "Lead Gen" | "Hiring" | "Event Promo" | "Product Launch";
  audience: string;
  includeEmojis: boolean;
  minifyHashtags: boolean;
  length: "Short" | "Medium" | "Long";
  useProfileContext: boolean;
};
type ProfileContext = { name: string; headline?: string; title?: string; company?: string; url?: string; avatarUrl?: string; skills?: string[]; };
type GeneratedPost = { id: string; text: string; hashtags: string[]; suggestions?: string[] };

const uid = () => Math.random().toString(36).slice(2);
const now = () => Date.now();
const saveLocal = <T,>(k: string, v: T) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const loadLocal = <T,>(k: string, fb: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fb; } catch { return fb; } };

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadLocal("lp.messages", []));
  const [input, setInput] = useState("");
  const [profile, setProfile] = useState<ProfileContext | null>(() => loadLocal("lp.profile", null));
  const [opts, setOpts] = useState<GenerationOptions>(() => loadLocal("lp.opts", {
    tone: "Professional",
    goal: "Awareness",
    audience: "AI engineers, PMs, founders",
    includeEmojis: true,
    minifyHashtags: false,
    length: "Medium",
    useProfileContext: true,
  }));
  const [draft, setDraft] = useState<GeneratedPost | null>(() => loadLocal("lp.draft", null));
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);
  useEffect(() => { saveLocal("lp.messages", messages); }, [messages]);
  useEffect(() => { saveLocal("lp.profile", profile); }, [profile]);
  useEffect(() => { saveLocal("lp.opts", opts); }, [opts]);
  useEffect(() => { saveLocal("lp.draft", draft); }, [draft]);

  const draftText = useMemo(() => draft ? `${draft.text}\n\n${draft.hashtags.join(" ")}` : "", [draft]);

  async function onSend() {
    if (!input.trim()) return;
    const newUser: ChatMessage = { id: uid(), role: "user", content: input.trim(), createdAt: now() };
    setMessages(prev => [...prev, newUser]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/generate-post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [...messages, newUser], opts, profile }) });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json() as GeneratedPost;
      setDraft(data);
      const assistant: ChatMessage = { id: uid(), role: "assistant", content: data.text + (data.hashtags.length ? `\n\n${data.hashtags.join(" ")}` : ""), createdAt: now() };
      setMessages(prev => [...prev, assistant]);
    } catch (e) {
      const assistant: ChatMessage = { id: uid(), role: "assistant", content: "Sorry — generation failed. Please try again.", createdAt: now() };
      setMessages(prev => [...prev, assistant]);
    } finally {
      setLoading(false);
    }
  }

  function reset() { setMessages([]); setDraft(null); }

  return (
    <div className="min-h-dvh text-slate-900">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white grid place-items-center">in</div>
            <div className="font-semibold tracking-tight">PostCraft for LinkedIn</div>
            <span className="text-xs rounded-full bg-slate-100 px-2 py-0.5">Beta</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reset} className="text-sm px-3 py-2 rounded-lg border hover:bg-slate-50">Clear chat</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl grid md:grid-cols-3 gap-6 px-4 py-6">
        <section className="md:col-span-1">
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="p-4 border-b"><h2 className="text-lg font-semibold">Style & Targeting</h2></div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs">Tone</label>
                  <select className="mt-1 w-full rounded-lg border p-2 text-sm" value={opts.tone} onChange={(e) => setOpts(o => ({...o, tone: e.target.value as any}))}>
                    {["Professional","Friendly","Bold","Inspiring","Analytical","Storytelling"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs">Length</label>
                  <select className="mt-1 w-full rounded-lg border p-2 text-sm" value={opts.length} onChange={(e) => setOpts(o => ({...o, length: e.target.value as any}))}>
                    {["Short","Medium","Long"].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs">Goal</label>
                <select className="mt-1 w-full rounded-lg border p-2 text-sm" value={opts.goal} onChange={(e) => setOpts(o => ({...o, goal: e.target.value as any}))}>
                  {["Awareness","Engagement","Lead Gen","Hiring","Event Promo","Product Launch"].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs">Audience (who's this for?)</label>
                <input className="mt-1 w-full rounded-lg border p-2 text-sm" value={opts.audience} onChange={(e) => setOpts(o => ({...o, audience: e.target.value}))} placeholder="e.g., data leaders in fintech" />
              </div>
              <div className="flex items-center gap-3 text-sm">
                <input id="emojis" type="checkbox" checked={opts.includeEmojis} onChange={(e) => setOpts(o => ({...o, includeEmojis: e.target.checked}))}/>
                <label htmlFor="emojis">Include emojis</label>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <input id="hashes" type="checkbox" checked={opts.minifyHashtags} onChange={(e) => setOpts(o => ({...o, minifyHashtags: e.target.checked}))}/>
                <label htmlFor="hashes">Minimal hashtags</label>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <input id="useProfile" type="checkbox" checked={opts.useProfileContext} onChange={(e) => setOpts(o => ({...o, useProfileContext: e.target.checked}))}/>
                <label htmlFor="useProfile">Use profile context</label>
              </div>
            </div>
          </div>
        </section>

        <section className="md:col-span-2 space-y-6">
          <div className="h-[56vh] md:h-[60vh] overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="p-4 border-b"><h2 className="text-lg font-semibold">Chat to craft your post</h2></div>
            <div className="h-full flex flex-col p-4">
              <div ref={chatRef} className="flex-1 overflow-y-auto pr-2 space-y-4">
                {messages.length === 0 && (
                  <div className="text-sm text-slate-500">
                    Tip: Tell me the topic, audience, and what outcome you want. Example: "Share a story about shipping an MVP in a week, aimed at early-stage founders, to drive engagement."
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow ${m.role === "user" ? "bg-slate-900 text-white" : "bg-white border"}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-end gap-2">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe the post you want..." className="min-h-[80px] flex-1 resize-none rounded-lg border p-3" />
                <button onClick={onSend} disabled={loading || !input.trim()} className="h-[80px] rounded-lg bg-slate-900 px-4 text-white disabled:opacity-50">
                  {loading ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Draft</h2>
              <div className="flex gap-2">
                <button className="text-sm px-3 py-2 rounded-lg border" onClick={() => draft && navigator.clipboard.writeText(draftText)}>Copy</button>
              </div>
            </div>
            <div className="p-4">
              {draft ? (
                <div className="space-y-3">
                  <div className="whitespace-pre-wrap">{draft.text}</div>
                  <div className="flex flex-wrap gap-2">{draft.hashtags.map((h) => <span key={h} className="rounded-full bg-slate-100 px-3 py-1 text-xs">{h}</span>)}</div>
                  {draft.suggestions?.length ? (
                    <div className="mt-2 text-sm text-slate-600">
                      <div className="font-medium mb-1">Suggestions</div>
                      <ul className="list-disc ml-5 space-y-1">
                        {draft.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-slate-500">Your draft will appear here once generated.</div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="pb-10 pt-2 text-center text-xs text-slate-500">Made with ❤️ — connected to a hosted LLM.</footer>
    </div>
  );
}
