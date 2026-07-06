// ── Quantify assembly — documented records vs Verity modeled estimate ───────
// The two are kept strictly separate and separately graded. Documented facts
// land at A/B; the Verity model lands at D and is always ranged + labeled.
import type { DocumentedLine, Financials, ModeledEstimate, QuantifyResult } from "./types";
import { aggregateGrade } from "./grade";

// Published-benchmark placeholders (USD). These are disclosed modeling
// assumptions, NOT government figures. Replace with sourced benchmarks in prod.
const BENCH = {
  perLbReleaseRemediation: 35, // $/lb documented release, order-of-magnitude
  nplBaseCost: 12_000_000, // presence of NPL listing baseline
  penaltyToLiabilityMultiple: 6, // assessed penalty as a floor signal
  liabilityUpliftLow: 1.2,
  liabilityUpliftExpected: 1.8,
  liabilityUpliftHigh: 3.4,
};

export function buildQuantify(
  documented: DocumentedLine[],
  financials: Financials,
): QuantifyResult {
  // Pull documented signals for the model inputs.
  const totalLbs = num(documented.find((d) => /reported releases \(total\)/i.test(d.category))?.value);
  const penalties = num(documented.find((d) => /penalt/i.test(d.category))?.value);
  const hasNPL = documented.some((d) => /superfund|npl/i.test(d.category));

  let expected = 0;
  const basisParts: string[] = [];
  if (totalLbs) {
    expected += totalLbs * BENCH.perLbReleaseRemediation;
    basisParts.push(`${totalLbs.toLocaleString()} lbs documented releases × $${BENCH.perLbReleaseRemediation}/lb benchmark`);
  }
  if (hasNPL) {
    expected += BENCH.nplBaseCost;
    basisParts.push(`NPL listing baseline $${(BENCH.nplBaseCost / 1e6).toFixed(0)}M`);
  }
  if (penalties) {
    expected += penalties * BENCH.penaltyToLiabilityMultiple;
    basisParts.push(`assessed penalties × ${BENCH.penaltyToLiabilityMultiple} liability-floor multiple`);
  }

  const modeled: ModeledEstimate[] = [];
  let headline: QuantifyResult["headlineLiability"] = null;

  if (expected > 0) {
    const remLow = Math.round(expected * 0.4);
    const remExp = Math.round(expected);
    const remHigh = Math.round(expected * 2.2);
    modeled.push({
      category: "Estimated remediation / cleanup cost",
      estimateLow: remLow,
      estimateExpected: remExp,
      estimateHigh: remHigh,
      unit: "USD",
      evidenceGrade: "D",
      basis: `Verity model — ${basisParts.join("; ") || "documented contamination"}. Wide band pending site-specific engineering data.`,
    });
    const liaLow = Math.round(expected * BENCH.liabilityUpliftLow);
    const liaExp = Math.round(expected * BENCH.liabilityUpliftExpected);
    const liaHigh = Math.round(expected * BENCH.liabilityUpliftHigh);
    modeled.push({
      category: "Estimated total financial liability",
      estimateLow: liaLow,
      estimateExpected: liaExp,
      estimateHigh: liaHigh,
      unit: "USD",
      evidenceGrade: "D",
      basis: "Verity model — remediation plus projected third-party, health, and oversight liability. Assumptions disclosed; not an adjudicated figure.",
    });
    headline = { low: liaLow, expected: liaExp, high: liaHigh };
  }

  let reportedVsTruth: QuantifyResult["reportedVsTruth"];
  if (financials.available && headline) {
    // Use net income proxy if present; else show assets/liabilities context.
    const reported = financials.revenue; // proxy — real impl should read NetIncomeLoss
    reportedVsTruth = {
      available: reported !== undefined,
      reportedProfit: reported,
      truthAdjustedProfit: reported !== undefined ? reported - headline.expected : undefined,
      note: reported !== undefined
        ? "Reported figure (EDGAR XBRL) less expected modeled liability. The reported figure is revenue-scale as a proxy; wire NetIncomeLoss for true profit."
        : "Public financials found but no comparable profit metric parsed.",
    };
  } else {
    reportedVsTruth = {
      available: false,
      note: financials.available
        ? "No modeled liability to net against yet."
        : "Financials not publicly available — the responsible party may be private (no EDGAR filings).",
    };
  }

  const grades = [...documented.map((d) => d.evidenceGrade), ...modeled.map((m) => m.evidenceGrade)];
  return {
    documented,
    modeled,
    headlineLiability: headline,
    reportedVsTruth,
    aggregateGrade: aggregateGrade(grades),
  };
}

function num(v: string | number | undefined): number | undefined {
  if (v === undefined) return undefined;
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}
