import { aiEnabled } from "@/lib/ai";
import { SAMPLE_DATA_DEFAULT, VERITY_MODEL } from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    service: "verity-site-dossier",
    aiEnabled: aiEnabled(),
    model: VERITY_MODEL,
    sampleDefault: SAMPLE_DATA_DEFAULT,
    secUserAgentSet: Boolean(process.env.SEC_USER_AGENT),
  });
}
