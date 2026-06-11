import React, { useCallback, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";

type BillingPeriod = "monthly" | "quarterly" | "annual";

type InvoiceResponse = {
  invoiceNumber?: string;
  date?: string;
  totalTTC?: number;
  supplierName?: string;
  currency?: string;
  confidences?: Record<string, number>;
};

export type InvoiceApplyData = {
  quarterlyBill: number;
  totalTTC?: number;
  billingPeriod: BillingPeriod;
  invoiceNumber?: string;
  supplierName?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/jpg,application/pdf";

function toQuarterly(amount: number, period: BillingPeriod): number {
  if (period === "monthly") return Math.round(amount * 3 * 100) / 100;
  if (period === "annual") return Math.round((amount / 4) * 100) / 100;
  return amount;
}

function confidenceTone(score: number | undefined): string {
  if (score == null || score === 0) return "text-gray-400";
  if (score >= 0.75) return "text-emerald-600";
  if (score >= 0.5) return "text-amber-600";
  return "text-red-600";
}

function fieldBorder(score: number | undefined): string {
  if (score == null || score === 0) return "border-gray-300";
  if (score >= 0.75) return "border-emerald-300 bg-emerald-50/40";
  if (score >= 0.5) return "border-amber-300 bg-amber-50/40";
  return "border-red-300 bg-red-50/40";
}

export default function InvoiceUploadModal({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (data: InvoiceApplyData) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"upload" | "review">("upload");
  const [result, setResult] = useState<InvoiceResponse | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("quarterly");
  const [amount, setAmount] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");

  const quarterlyPreview = amount
    ? toQuarterly(parseFloat(amount) || 0, billingPeriod)
    : 0;

  const pickFile = useCallback((f: File | null) => {
    setError(null);
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      setError("Fichier trop volumineux (max 5 Mo).");
      return;
    }
    const ok =
      f.type.startsWith("image/") || f.type === "application/pdf" || /\.(jpe?g|png|webp|pdf)$/i.test(f.name);
    if (!ok) {
      setError("Format non supporté. Utilisez JPG, PNG ou PDF.");
      return;
    }
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
    setPhase("upload");
    setResult(null);
  }, []);

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    pickFile(e.target.files?.[0] ?? null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  function applyParsedResult(json: InvoiceResponse) {
    setResult(json);
    const detected = json.totalTTC != null ? String(json.totalTTC) : "";
    setAmount(detected);
    setInvoiceNumber(json.invoiceNumber ?? "");
    setSupplierName(json.supplierName ?? "");
    const supplierLower = (json.supplierName ?? "").toLowerCase();
    if (supplierLower.includes("steg")) {
      setBillingPeriod("quarterly");
    }
    setPhase("review");
  }

  async function pollParseJob(jobId: string, startedAt: number): Promise<InvoiceResponse | null> {
    const maxWaitMs = 5 * 60 * 1000;
    while (Date.now() - startedAt < maxWaitMs) {
      const statusRes = await fetch(`/api/dimensioning/invoices/parse-jobs/${jobId}`);
      // #region agent log
      fetch("http://127.0.0.1:7481/ingest/a2021df7-c138-4bb1-b24c-c5adc0b4a923", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "34125a" },
        body: JSON.stringify({
          sessionId: "34125a",
          hypothesisId: "B",
          location: "InvoiceUploadModal.tsx:poll",
          message: "parse job poll",
          data: {
            jobId,
            statusCode: statusRes.status,
            elapsedMs: Date.now() - startedAt,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (statusRes.status === 404) {
        return null;
      }
      if (!statusRes.ok) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      const job = (await statusRes.json()) as {
        status: string;
        result?: InvoiceResponse;
        error?: string;
      };
      if (job.status === "COMPLETED" && job.result) {
        return job.result;
      }
      if (job.status === "FAILED") {
        throw new Error(job.error ?? "OCR failed");
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error("timeout");
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const startedAt = Date.now();
    // #region agent log
    fetch("http://127.0.0.1:7481/ingest/a2021df7-c138-4bb1-b24c-c5adc0b4a923", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "34125a" },
      body: JSON.stringify({
        sessionId: "34125a",
        hypothesisId: "A",
        location: "InvoiceUploadModal.tsx:analyze:start",
        message: "invoice parse async start",
        data: { fileName: file.name, fileSize: file.size, fileType: file.type },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    try {
      const res = await fetch("/api/dimensioning/invoices/parse-async", {
        method: "POST",
        body: fd,
      });
      // #region agent log
      fetch("http://127.0.0.1:7481/ingest/a2021df7-c138-4bb1-b24c-c5adc0b4a923", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "34125a" },
        body: JSON.stringify({
          sessionId: "34125a",
          hypothesisId: "B",
          location: "InvoiceUploadModal.tsx:analyze:upload",
          message: "parse-async response",
          data: {
            status: res.status,
            ok: res.ok,
            elapsedMs: Date.now() - startedAt,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (!res.ok) {
        setError(
          "Impossible de lire la facture. Vérifiez la qualité de l'image ou saisissez le montant manuellement."
        );
        return;
      }
      const { jobId } = (await res.json()) as { jobId?: string };
      if (!jobId) {
        setError("Réponse serveur invalide. Réessayez.");
        return;
      }
      const json = await pollParseJob(jobId, startedAt);
      if (!json) {
        setError("Analyse introuvable. Réessayez.");
        return;
      }
      // #region agent log
      fetch("http://127.0.0.1:7481/ingest/a2021df7-c138-4bb1-b24c-c5adc0b4a923", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "34125a" },
        body: JSON.stringify({
          sessionId: "34125a",
          hypothesisId: "C",
          location: "InvoiceUploadModal.tsx:analyze:done",
          message: "invoice parse completed",
          data: {
            totalTTC: json.totalTTC ?? null,
            elapsedMs: Date.now() - startedAt,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      applyParsedResult(json);
    } catch (err) {
      // #region agent log
      fetch("http://127.0.0.1:7481/ingest/a2021df7-c138-4bb1-b24c-c5adc0b4a923", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "34125a" },
        body: JSON.stringify({
          sessionId: "34125a",
          hypothesisId: "B",
          location: "InvoiceUploadModal.tsx:analyze:error",
          message: "invoice parse failed",
          data: {
            error: err instanceof Error ? err.message : "unknown",
            elapsedMs: Date.now() - startedAt,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      setError(
        err instanceof Error && err.message === "timeout"
          ? "L'analyse a pris trop de temps. Réessayez ou saisissez le montant manuellement."
          : "Erreur réseau. Réessayez ou saisissez le montant à la main."
      );
    } finally {
      setLoading(false);
    }
  }

  function confidenceLabel(key: string) {
    const score = result?.confidences?.[key];
    if (score == null || score === 0) return "non détecté";
    return `${Math.round(score * 100)} %`;
  }

  function apply() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError("Indiquez un montant valide pour continuer.");
      return;
    }
    const quarterlyBill = toQuarterly(parsed, billingPeriod);
    onApply({
      quarterlyBill,
      totalTTC: parsed,
      billingPeriod,
      invoiceNumber: invoiceNumber || undefined,
      supplierName: supplierName || undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="invoice-modal-title"
      >
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary mb-1">
              Étape facture · STEG
            </p>
            <h3 id="invoice-modal-title" className="text-xl font-semibold text-secondary">
              {phase === "upload"
                ? "Importer votre facture d'électricité"
                : "Vérifier les informations extraites"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {phase === "upload"
                ? "Photo ou PDF — nous extrayons le montant pour alimenter la simulation."
                : "Corrigez si besoin, puis confirmez le montant trimestriel utilisé."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {phase === "upload" && (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary/60 hover:bg-gray-50"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={onInputChange}
                />
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <p className="font-medium text-secondary">
                  Glissez votre facture ici ou cliquez pour parcourir
                </p>
                <p className="text-sm text-gray-500 mt-2">JPG, PNG, PDF — max 5 Mo</p>
                {file && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
                    <FileText className="w-4 h-4 text-primary" />
                    {file.name}
                  </div>
                )}
              </div>

              {preview && (
                <img
                  src={preview}
                  className="max-h-48 mx-auto rounded-lg border border-gray-200 object-contain"
                  alt="Aperçu facture"
                />
              )}

              <ul className="grid sm:grid-cols-3 gap-2 text-xs text-gray-600">
                <li className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  Montant total visible
                </li>
                <li className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  Photo nette, bien éclairée
                </li>
                <li className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  Facture STEG recommandée
                </li>
              </ul>
            </>
          )}

          {phase === "review" && (
            <>
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <p className="text-sm font-medium text-secondary">
                  Montant utilisé pour la simulation
                </p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {quarterlyPreview > 0 ? `${quarterlyPreview} TND` : "—"}{" "}
                  <span className="text-sm font-normal text-gray-600">/ trimestre</span>
                </p>
                {(result?.supplierName ?? supplierName).toLowerCase().includes("steg") && (
                  <p className="text-xs text-gray-600 mt-2">
                    Total électricité uniquement (hors gaz et taxes). Si le montant est vide,
                    saisissez la ligne « Électricité » de votre facture (ex. 118 TND).
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {(result?.supplierName ?? supplierName).toLowerCase().includes("steg")
                      ? "Total électricité (TND)"
                      : "Montant détecté (TND)"}
                    <span
                      className={`ml-2 text-xs ${confidenceTone(result?.confidences?.totalTTC)}`}
                    >
                      {confidenceLabel("totalTTC")}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${fieldBorder(result?.confidences?.totalTTC)}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Période de la facture
                  </label>
                  <select
                    value={billingPeriod}
                    onChange={(e) =>
                      setBillingPeriod(e.target.value as BillingPeriod)
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="quarterly">Trimestrielle (STEG)</option>
                    <option value="monthly">Mensuelle (×3)</option>
                    <option value="annual">Annuelle (÷4)</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° facture
                    <span
                      className={`ml-2 text-xs ${confidenceTone(result?.confidences?.invoiceNumber)}`}
                    >
                      {confidenceLabel("invoiceNumber")}
                    </span>
                  </label>
                  <input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg ${fieldBorder(result?.confidences?.invoiceNumber)}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fournisseur
                    <span
                      className={`ml-2 text-xs ${confidenceTone(result?.confidences?.supplierName)}`}
                    >
                      {confidenceLabel("supplierName")}
                    </span>
                  </label>
                  <input
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Ex: STEG"
                    className={`w-full px-3 py-2.5 border rounded-lg ${fieldBorder(result?.confidences?.supplierName)}`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPhase("upload");
                  setError(null);
                }}
                className="text-sm text-primary hover:underline"
              >
                ← Choisir un autre fichier
              </button>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 p-6 pt-0 border-t border-gray-100 mt-2">
          {phase === "upload" ? (
            <>
              <button
                type="button"
                onClick={analyze}
                disabled={loading || !file}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyse en cours… (jusqu&apos;à 2 min)
                  </>
                ) : (
                  "Analyser ma facture"
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-100 text-secondary rounded-lg font-medium hover:bg-gray-200"
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={apply}
                disabled={!amount || parseFloat(amount) <= 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-medium disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Continuer la simulation
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-100 text-secondary rounded-lg font-medium"
              >
                Annuler
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
