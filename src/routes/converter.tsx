import { Link, createFileRoute } from "@tanstack/react-router";
import { Copy, Download, FileText, Loader2, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InvoiceForm } from "@/components/invoice-form";
import { IssuesList } from "@/components/issues-list";
import { Button } from "@/components/ui/button";
import { saveConversion } from "@/lib/peppol/conversions";
import { extractInvoice } from "@/lib/peppol/extract";
import { t } from "@/lib/peppol/i18n";
import { extractPdfText, renderPdfPage, type PdfProgress } from "@/lib/peppol/pdf";
import { consumeAnonymousQuota, fetchQuota, getAnonymousQuota, type QuotaState } from "@/lib/peppol/quota";
import { usePrefs } from "@/lib/peppol/prefs";
import { SAMPLE_INVOICE_TEXT } from "@/lib/peppol/sample";
import { EMPTY_INVOICE, type InvoiceData } from "@/lib/peppol/types";
import { validateInvoice } from "@/lib/peppol/validate";
import { buildUblXml, suggestedFilename } from "@/lib/peppol/xml";
import { useAuth } from "@/lib/auth/local";
import { cn, downloadBlob } from "@/lib/utils";

type Search = { sample?: boolean };
export const Route = createFileRoute("/converter")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const raw = s.sample;
    const sample = raw === true || raw === "true" || raw === "1" || raw === 1 || (typeof raw === "string" && raw.replaceAll('"', "") === "1");
    return { sample: sample || undefined };
  },
  component: ConverterPage,
});

function looksLikeInvoice(text: string): boolean {
  const normalized = text.toLowerCase();
  const markers = {
    invoice: /\b(invoice|factuur|facture)\b/.test(normalized),
    vat: /\b(vat|btw|tva)\b/.test(normalized),
    total: /\b(total|totaal|montant)\b/.test(normalized),
    party: /\b(supplier|seller|leverancier|fournisseur|customer|buyer|klant|client|bill to)\b/.test(normalized),
    currency: /\b(iban|eur|€)\b/.test(normalized),
    invoiceId: /\b(?:invoice|factuur|facture)\s*(?:number|no\.?|#|n[°oº]|num[eé]ro)\s*[:#./-]?\s*[A-Z0-9][A-Z0-9/_-]{2,}\b/i.test(text) || /\bINV[-/]\d{2,4}[-/]?\d{2,}\b/i.test(text),
    date: /\b(?:invoice\s*date|factuurdatum|issue\s*date|date\s*(?:de\s*)?facture)\s*[:.]?\s*\d{1,2}[./-]\d{1,2}[./-]\d{4}\b/i.test(text),
  };
  const strongIdentity = markers.invoiceId || markers.date;
  const supportingMarkers = [markers.vat, markers.total, markers.party, markers.currency].filter(Boolean).length;
  return strongIdentity && markers.invoice && supportingMarkers >= 2 && /\d/.test(normalized);
}

function ConverterPage() {
  const lang = usePrefs((s) => s.lang);
  const user = useAuth((s) => s.user);
  const { sample } = Route.useSearch();
  const [data, setData] = useState<InvoiceData>(EMPTY_INVOICE);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState<PdfProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaState>({ used: 0, limit: 3, remaining: 3 });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [tab, setTab] = useState<"pdf" | "fields" | "xml">("pdf");
  const [conversionReady, setConversionReady] = useState(false);
  const [converting, setConverting] = useState(false);
  const [checked, setChecked] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) void fetchQuota().then(setQuota).catch(() => undefined);
    else setQuota(getAnonymousQuota());
  }, [user]);

  const xml = useMemo(() => buildUblXml(data), [data]);
  const result = useMemo(() => validateInvoice(data), [data]);
  const blockingIssues = result.issues.filter((issue) => issue.severity === "error").length;

  const loadSample = useCallback(() => {
    setData(extractInvoice(SAMPLE_INVOICE_TEXT));
    setFileName("sample-invoice.txt");
    setError(null);
    setConversionReady(false);
    setChecked(true);
    setTab("fields");
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("sample");
    if (sample || q === "true" || q === "1") loadSample();
  }, [sample, loadSample]);

  async function onFile(file: File) {
    setError(null);
    setConversionReady(false);
    setProgress({ stage: "loading", page: 0, total: 0 });
    const extracted = await extractPdfText(file, setProgress);
    setProgress(null);

    if (!extracted.success) {
      setData(EMPTY_INVOICE);
      setFileName(null);
      setChecked(false);
      setTab("pdf");
      setError(extracted.error?.userMessage ?? "Could not read PDF.");
      return;
    }

    if (!looksLikeInvoice(extracted.fullText)) {
      setData(EMPTY_INVOICE);
      setFileName(null);
      setChecked(false);
      setTab("pdf");
      setError("This PDF does not contain enough invoice evidence. Upload an invoice with an invoice number or issue date plus VAT/tax and total details.");
      return;
    }

    const nextData = extractInvoice(extracted.fullText);
    setData(nextData);
    setFileName(file.name);
    setChecked(true);
    setTab("fields");
    if (canvasRef.current) {
      try {
        await renderPdfPage(file, 1, canvasRef.current);
      } catch {
        // Preview failure must not block extraction or validation.
      }
    }
  }

  async function onConvert() {
    if (!result.ok || conversionReady || converting) return;
    setError(null);
    setConverting(true);
    try {
      if (!user) {
        if (quota.remaining <= 0) {
          setShowUpgrade(true);
          setError("Your anonymous trial quota is used up. Create a free account to continue.");
          return;
        }
        const next = consumeAnonymousQuota();
        setQuota(next);
        setConversionReady(true);
        setTab("xml");
        return;
      }

      await saveConversion(user.id, {
        invoice_id: data.invoiceNumber.value || "untitled",
        supplier: data.supplierName.value,
        customer: data.customerName.value,
        total: data.payableAmount.value,
        currency: data.currency.value,
        status: "ok",
        issue_count: result.issues.length,
      });
      setConversionReady(true);
      setTab("xml");
      void fetchQuota().then(setQuota).catch(() => undefined);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to convert invoice.";
      if (/limit reached/i.test(message)) setShowUpgrade(true);
      setError(message);
    } finally {
      setConverting(false);
    }
  }

  function onDownload() {
    if (!conversionReady) {
      setTab("fields");
      setError("Convert the invoice first. Conversion usage is consumed when a successful conversion is prepared, not when XML is downloaded.");
      return;
    }
    downloadBlob(suggestedFilename(data), new Blob([xml], { type: "application/xml;charset=utf-8" }));
  }

  async function onCopy() {
    if (!conversionReady) {
      setTab("fields");
      setError("Convert the invoice first. XML copy is available after the successful conversion is recorded.");
      return;
    }
    await navigator.clipboard.writeText(xml);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{t(lang, "convert_title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t(lang, "convert_sub")}</p>
        </div>
        <p className="text-sm text-muted">{t(lang, "quota", { used: quota.used, limit: quota.limit })}</p>
      </div>

      <div className="mt-6 flex gap-1 rounded-lg border border-border bg-surface p-1 lg:hidden">
        {(["pdf", "fields", "xml"] as const).map((id) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={cn("h-11 flex-1 rounded-md text-sm", tab === id ? "bg-accent text-accent-fg" : "text-muted")}>
            {id === "pdf" ? "PDF" : id === "fields" ? t(lang, "fields") : t(lang, "xml_preview")}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className={cn("rounded-2xl border border-border bg-elevated p-4", tab !== "pdf" && "hidden lg:block")}>
          <h2 className="text-sm font-medium">{t(lang, "drop_title")}</h2>
          <p className="mt-1 text-xs text-muted">{t(lang, "drop_hint")}</p>
          <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void onFile(f); }} className="mt-4 grid min-h-48 cursor-pointer place-items-center rounded-xl border border-dashed border-border bg-surface p-6 text-center">
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.currentTarget.value = ""; }} />
            <Upload className="size-6 text-accent" />
            <p className="mt-2 text-sm">{t(lang, "drop_browse")}</p>
            {fileName ? <p className="mt-1 text-xs text-muted">{fileName}</p> : null}
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>{t(lang, "drop_browse")}</Button>
            <Button type="button" variant="ghost" size="sm" onClick={loadSample}><FileText className="size-4" />{t(lang, "sample")}</Button>
          </div>
          {progress ? <p className="mt-3 flex items-center gap-2 text-sm text-muted"><Loader2 className="size-4 animate-spin" />{t(lang, "extracting", { page: progress.page, total: progress.total })}</p> : null}
          {error ? <p role="alert" className="mt-3 text-sm text-danger">{error}</p> : null}
          <canvas ref={canvasRef} className="mt-4 max-h-80 w-full rounded-lg border border-border bg-surface" />
        </section>

        <section className={cn("max-h-[80vh] overflow-auto rounded-2xl border border-border bg-surface p-4", tab !== "fields" && "hidden lg:block")}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium">{t(lang, "fields")}</h2>
            {checked ? (
              <span role="status" aria-live="polite" className={cn("rounded-full px-3 py-1 text-xs font-bold tracking-wide", result.ok ? "bg-accent text-accent-fg" : "bg-danger/10 text-danger")}>
                {result.ok ? (conversionReady ? "PASS — READY" : "PASS — REVIEW & CONVERT") : `FAIL — ${blockingIssues} BLOCKING ${blockingIssues === 1 ? "CHECK" : "CHECKS"}`}
              </span>
            ) : (
              <span role="status" className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">NOT CHECKED</span>
            )}
          </div>
          {checked ? <p className="mb-4 text-xs text-muted">{result.ok ? (conversionReady ? "Conversion recorded. You can now copy or download the XML." : "All blocking Peppol checks pass. Review the fields, then explicitly convert to consume one document unit.") : "This invoice cannot be converted until the blocking checks are fixed."}</p> : null}
          <InvoiceForm data={data} onChange={(next) => { setData(next); setConversionReady(false); }} lang={lang} />
          <div className="mt-6"><h3 className="mb-2 text-sm font-medium">{t(lang, "issues")}</h3><IssuesList result={result} lang={lang} /></div>
        </section>

        <section className={cn("flex flex-col rounded-2xl border border-border bg-elevated p-4", tab !== "xml" && "hidden lg:block")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium">{t(lang, "xml_preview")}</h2>
              <p className="mt-1 text-xs text-muted">Usage is counted when a successful conversion is explicitly prepared.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={!result.ok || conversionReady || converting} onClick={() => void onConvert()}>{converting ? <Loader2 className="size-4 animate-spin" /> : null}{converting ? "Converting…" : "Convert & prepare XML"}</Button>
              <Button type="button" variant="outline" size="sm" disabled={!conversionReady} onClick={() => void onCopy()}><Copy className="size-4" />{t(lang, "copy_xml")}</Button>
              <Button type="button" variant="outline" size="sm" disabled={!conversionReady} onClick={onDownload}><Download className="size-4" />{t(lang, "download_xml")}</Button>
            </div>
          </div>
          <pre className={cn("mt-3 max-h-[70vh] flex-1 overflow-auto rounded-xl bg-bg p-3 font-mono text-[11px] leading-relaxed text-fg", !conversionReady && "opacity-40 select-none")} aria-label={conversionReady ? "Generated UBL XML" : "XML preview locked until conversion"}>{conversionReady ? xml : "XML will be available after you review the extracted fields and explicitly convert the invoice."}</pre>
        </section>
      </div>

      {showUpgrade ? <div className="fixed inset-0 z-50 grid place-items-center bg-fg/40 p-4"><div className="w-full max-w-md rounded-2xl border border-border bg-elevated p-6"><h3 className="font-display text-2xl">{t(lang, "quota_full")}</h3><p className="mt-2 text-sm text-muted">{t(lang, "convert_sub")}</p><div className="mt-5 flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setShowUpgrade(false)}>{t(lang, "continue")}</Button><Button asChild><Link to="/pricing">{t(lang, "upgrade")}</Link></Button></div></div></div> : null}
    </main>
  );
}
