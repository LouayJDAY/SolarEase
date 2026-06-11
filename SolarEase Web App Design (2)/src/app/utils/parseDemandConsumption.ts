export interface ParsedDemandConsumption {
  quarterlyBillTnd: number | null;
  dailyConsumptionKwh: number | null;
  roofAreaM2: number | null;
}

function parseNumber(raw: string): number | null {
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const value = parseFloat(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Extract STEG bill / roof data from client demand or project description text. */
export function parseDemandConsumption(text?: string | null): ParsedDemandConsumption {
  if (!text?.trim()) {
    return { quarterlyBillTnd: null, dailyConsumptionKwh: null, roofAreaM2: null };
  }

  const quarterlyMatch = text.match(
    /facture\s+trimestrielle\s*:\s*([\d.,]+)\s*tnd/i
  );
  const monthlyMatch = text.match(
    /facture\s+(?:mensuelle|mensuel)\s*:\s*([\d.,]+)\s*tnd/i
  );
  const dailyMatch = text.match(
    /consommation(?:\s+quotidienne|\s+journalière|\s+client)?\s*:\s*([\d.,]+)\s*kwh(?:\s*\/\s*jour)?/i
  );
  const roofMatch = text.match(/surface\s+toiture\s*:\s*([\d.,]+)\s*m/i);

  let quarterlyBillTnd = quarterlyMatch ? parseNumber(quarterlyMatch[1]) : null;
  if (!quarterlyBillTnd && monthlyMatch) {
    const monthly = parseNumber(monthlyMatch[1]);
    quarterlyBillTnd = monthly != null ? monthly * 3 : null;
  }

  return {
    quarterlyBillTnd,
    dailyConsumptionKwh: dailyMatch ? parseNumber(dailyMatch[1]) : null,
    roofAreaM2: roofMatch ? parseNumber(roofMatch[1]) : null,
  };
}
