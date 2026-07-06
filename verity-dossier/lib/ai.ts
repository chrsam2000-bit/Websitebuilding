// ── AI layer (server-only, optional, strictly grounded) ─────────────────────
// The AI's ONLY jobs are: rerank entity candidates, summarize retrieved
// records, and draft the deliverable prose. It never introduces a fact that is
// not in the assembled, cited dossier. If ANTHROPIC_API_KEY is unset, callers
// fall back to deterministic templates.
import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY, VERITY_MODEL } from "./config";

export const aiEnabled = () => Boolean(ANTHROPIC_API_KEY);

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  return client;
}

/**
 * Ask the model to rewrite a fully-assembled, cited memo into cleaner prose.
 * The system prompt forbids adding, removing, or altering any fact, number,
 * name, or citation. Returns null on any failure so the caller keeps the
 * deterministic memo.
 */
export async function polishMemo(structuredMemo: string): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  const system = `You are an editor for Terra Verity Ledger. You are given a fully-assembled, evidence-graded dossier memo whose every fact is already sourced from government records. Rewrite it into clean, professional prose. ABSOLUTE RULES: do not add, remove, or change any fact, number, entity name, evidence grade, citation, or disclaimer. Do not introduce any information not present in the input. Keep all bracketed citations and the disclaimer verbatim. Output only the finished memo — no preamble, no commentary.`;
  try {
    const msg = await c.messages.create({
      model: VERITY_MODEL,
      max_tokens: 3500,
      system,
      messages: [{ role: "user", content: structuredMemo }],
    });
    const block = msg.content.find((b) => b.type === "text") as { type: "text"; text: string } | undefined;
    const text = block?.text?.trim();
    return text && text.length > 100 ? text : null;
  } catch {
    return null; // never break the dossier on an AI failure
  }
}
