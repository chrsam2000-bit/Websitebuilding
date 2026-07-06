// POST /api/deliverable — generate a deliverable memo from an assembled dossier.
// The client posts back the dossier it holds + the chosen mode; the server draft
// is built deterministically from cited data (AI polish only if a key is set).
import { generateDeliverable } from "@/lib/deliverables";
import type { Dossier, DeliverableMode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON body" }), { status: 400 });
  }
  const dossier = body.dossier as Dossier | undefined;
  const mode = body.mode as DeliverableMode | undefined;
  const aiPolish = Boolean(body.aiPolish);
  if (!dossier || !mode) return new Response(JSON.stringify({ error: "dossier and mode are required" }), { status: 400 });
  if (mode !== "litigation" && mode !== "remediation") return new Response(JSON.stringify({ error: "invalid mode" }), { status: 400 });

  const out = await generateDeliverable(mode, dossier, { aiPolish });
  return Response.json(out);
}
