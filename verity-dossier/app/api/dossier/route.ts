// POST /api/dossier — streams the Evidence Log + stage results as Server-Sent
// Events, then the final assembled dossier. All EPA/SEC calls happen here,
// server-side (SEC User-Agent, caching, backoff). Never called from the client
// directly against .gov.
import { orchestrate } from "@/lib/orchestrate";
import { SAMPLE_DATA_DEFAULT } from "@/lib/config";
import type { DossierInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON body" }), { status: 400 });
  }
  const query = String(payload.query ?? "").trim();
  if (!query) return new Response(JSON.stringify({ error: "query is required" }), { status: 400 });

  const input: DossierInput = {
    query,
    state: payload.state ? String(payload.state).trim().toUpperCase() : undefined,
    operator: payload.operator ? String(payload.operator).trim() : undefined,
    contaminationType: payload.contaminationType ? String(payload.contaminationType).trim() : undefined,
  };
  const sample = payload.sample === undefined ? SAMPLE_DATA_DEFAULT : Boolean(payload.sample);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        for await (const msg of orchestrate(input, sample)) send(msg);
      } catch (err) {
        send({ t: "event", event: { ts: new Date().toISOString(), source: "orchestrator", status: "error", detail: `Fatal: ${(err as Error).message}` } });
        send({ t: "fatal", error: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
